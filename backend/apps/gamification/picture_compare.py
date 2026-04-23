import time

from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat

FAST_SIZE = (160, 160)
FINAL_SIZE = (224, 224)


def _center_square(image):
    width, height = image.size
    edge = min(width, height)
    left = (width - edge) // 2
    top = (height - edge) // 2
    return image.crop((left, top, left + edge, top + edge))


def _prepare_grayscale(source, size):
    if hasattr(source, "open"):
        source.open("rb")
    if hasattr(source, "seek"):
        source.seek(0)
    image = Image.open(source)
    image = ImageOps.exif_transpose(image)
    image = image.convert("L")
    image = _center_square(image)
    image = ImageOps.autocontrast(image)
    return image.resize(size, Image.Resampling.BILINEAR)


def _overlap_boxes(width, height, dx, dy):
    ref_left = max(dx, 0)
    ref_top = max(dy, 0)
    ref_right = min(width, width + dx)
    ref_bottom = min(height, height + dy)

    overlap_width = ref_right - ref_left
    overlap_height = ref_bottom - ref_top
    if overlap_width <= 0 or overlap_height <= 0:
        return None

    attempt_left = max(-dx, 0)
    attempt_top = max(-dy, 0)
    attempt_right = attempt_left + overlap_width
    attempt_bottom = attempt_top + overlap_height

    return (
        (ref_left, ref_top, ref_right, ref_bottom),
        (attempt_left, attempt_top, attempt_right, attempt_bottom),
        overlap_width * overlap_height,
    )


def _best_shift_similarity(reference, attempt, max_shift, step):
    width, height = reference.size
    total_pixels = width * height
    best_similarity = 0.0

    for dx in range(-max_shift, max_shift + 1, step):
        for dy in range(-max_shift, max_shift + 1, step):
            overlap = _overlap_boxes(width, height, dx, dy)
            if overlap is None:
                continue

            ref_box, attempt_box, overlap_pixels = overlap
            ref_crop = reference.crop(ref_box)
            attempt_crop = attempt.crop(attempt_box)

            difference = ImageChops.difference(ref_crop, attempt_crop)
            mean_difference = ImageStat.Stat(difference).mean[0]
            raw_similarity = 1.0 - (mean_difference / 255.0)
            overlap_ratio = overlap_pixels / total_pixels

            # Penalize large shifts by considering only overlapping content.
            similarity = raw_similarity * overlap_ratio
            if similarity > best_similarity:
                best_similarity = similarity

    return max(0.0, min(1.0, best_similarity))


def _histogram_similarity(reference, attempt):
    ref_hist = reference.histogram()
    attempt_hist = attempt.histogram()

    ref_total = float(sum(ref_hist)) or 1.0
    attempt_total = float(sum(attempt_hist)) or 1.0

    # Total variation distance mapped to [0, 1], where 1 is identical.
    l1 = sum(
        abs((ref_bin / ref_total) - (attempt_bin / attempt_total))
        for ref_bin, attempt_bin in zip(ref_hist, attempt_hist)
    )
    return max(0.0, min(1.0, 1.0 - (l1 / 2.0)))


def _grid_mean_similarity(reference, attempt, grid=6):
    width, height = reference.size
    block_w = max(1, width // grid)
    block_h = max(1, height // grid)

    score_sum = 0.0
    count = 0

    for row in range(grid):
        for col in range(grid):
            left = col * block_w
            top = row * block_h
            right = width if col == grid - 1 else (col + 1) * block_w
            bottom = height if row == grid - 1 else (row + 1) * block_h

            ref_mean = ImageStat.Stat(reference.crop((left, top, right, bottom))).mean[
                0
            ]
            attempt_mean = ImageStat.Stat(
                attempt.crop((left, top, right, bottom))
            ).mean[0]

            score_sum += 1.0 - (abs(ref_mean - attempt_mean) / 255.0)
            count += 1

    return max(0.0, min(1.0, score_sum / max(1, count)))


def compare_picture_similarity(reference_image_file, attempt_image_file, threshold):
    started_at = time.perf_counter()

    reference_fast = _prepare_grayscale(reference_image_file, FAST_SIZE)
    attempt_fast = _prepare_grayscale(attempt_image_file, FAST_SIZE)

    stage_a_similarity = _best_shift_similarity(
        reference_fast,
        attempt_fast,
        max_shift=8,
        step=2,
    )

    # Fast reject for clearly different images.
    if stage_a_similarity < 0.35:
        processing_ms = int((time.perf_counter() - started_at) * 1000)
        return {
            "accepted": False,
            "similarity_score": round(stage_a_similarity, 4),
            "processing_ms": processing_ms,
        }

    reference_final = _prepare_grayscale(reference_image_file, FINAL_SIZE)
    attempt_final = _prepare_grayscale(attempt_image_file, FINAL_SIZE)

    base_similarity = _best_shift_similarity(
        reference_final,
        attempt_final,
        max_shift=12,
        step=2,
    )

    edge_reference = reference_final.filter(ImageFilter.FIND_EDGES)
    edge_attempt = attempt_final.filter(ImageFilter.FIND_EDGES)
    edge_similarity = _best_shift_similarity(
        edge_reference,
        edge_attempt,
        max_shift=12,
        step=2,
    )

    hist_similarity = _histogram_similarity(reference_final, attempt_final)
    grid_similarity = _grid_mean_similarity(reference_final, attempt_final)

    combined_similarity = (
        (0.45 * base_similarity)
        + (0.25 * edge_similarity)
        + (0.15 * hist_similarity)
        + (0.15 * grid_similarity)
    )

    # Penalize false positives where broad tonal or spatial structure diverges.
    if hist_similarity < 0.78:
        combined_similarity *= 0.82
    if grid_similarity < 0.72:
        combined_similarity *= 0.82

    combined_similarity = max(0.0, min(1.0, combined_similarity))

    processing_ms = int((time.perf_counter() - started_at) * 1000)
    return {
        "accepted": combined_similarity >= threshold,
        "similarity_score": round(combined_similarity, 4),
        "processing_ms": processing_ms,
    }
