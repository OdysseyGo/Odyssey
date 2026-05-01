import time

from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat

FAST_SIZE = (160, 160)
FINAL_SIZE = (224, 224)
DEFAULT_COMPARE_CONFIG = {
    "fast_max_shift": 8,
    "fast_step": 2,
    "final_max_shift": 12,
    "final_step": 2,
    "edge_max_shift": 12,
    "edge_step": 2,
    "fast_reject_threshold": 0.35,
    "base_weight": 0.45,
    "edge_weight": 0.25,
    "histogram_weight": 0.15,
    "grid_weight": 0.15,
    "histogram_penalty_threshold": 0.78,
    "grid_penalty_threshold": 0.72,
    "histogram_penalty_multiplier": 0.82,
    "grid_penalty_multiplier": 0.82,
}


def _center_square(image):
    width, height = image.size
    edge = min(width, height)
    left = (width - edge) // 2
    top = (height - edge) // 2
    return image.crop((left, top, left + edge, top + edge))


def _prepare_grayscale(source, size):
    opened_source = False
    if hasattr(source, "open") and hasattr(source, "storage"):
        source.open("rb")
        opened_source = True
    if hasattr(source, "seek"):
        source.seek(0)

    try:
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image)
            image = image.convert("L")
            image = _center_square(image)
            image = ImageOps.autocontrast(image)
            return image.resize(size, Image.Resampling.BILINEAR).copy()
    finally:
        if opened_source and hasattr(source, "close"):
            source.close()


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


def _compare_config(overrides=None):
    config = DEFAULT_COMPARE_CONFIG.copy()
    if overrides:
        for key, value in overrides.items():
            if value is not None and key in config:
                config[key] = value

    for key in (
        "fast_max_shift",
        "fast_step",
        "final_max_shift",
        "final_step",
        "edge_max_shift",
        "edge_step",
    ):
        config[key] = max(1, int(config[key]))

    for key in (
        "fast_reject_threshold",
        "base_weight",
        "edge_weight",
        "histogram_weight",
        "grid_weight",
        "histogram_penalty_threshold",
        "grid_penalty_threshold",
        "histogram_penalty_multiplier",
        "grid_penalty_multiplier",
    ):
        config[key] = max(0.0, min(1.0, float(config[key])))

    weight_total = (
        config["base_weight"]
        + config["edge_weight"]
        + config["histogram_weight"]
        + config["grid_weight"]
    )
    if weight_total <= 0:
        config["base_weight"] = DEFAULT_COMPARE_CONFIG["base_weight"]
        config["edge_weight"] = DEFAULT_COMPARE_CONFIG["edge_weight"]
        config["histogram_weight"] = DEFAULT_COMPARE_CONFIG["histogram_weight"]
        config["grid_weight"] = DEFAULT_COMPARE_CONFIG["grid_weight"]
        weight_total = 1.0

    config["weight_total"] = weight_total
    return config


def compare_picture_similarity(
    reference_image_file,
    attempt_image_file,
    threshold,
    tuning_config=None,
    include_breakdown=False,
):
    started_at = time.perf_counter()
    config = _compare_config(tuning_config)

    reference_fast = _prepare_grayscale(reference_image_file, FAST_SIZE)
    attempt_fast = _prepare_grayscale(attempt_image_file, FAST_SIZE)

    stage_a_similarity = _best_shift_similarity(
        reference_fast,
        attempt_fast,
        max_shift=config["fast_max_shift"],
        step=config["fast_step"],
    )

    # Fast reject for clearly different images.
    if stage_a_similarity < config["fast_reject_threshold"]:
        processing_ms = int((time.perf_counter() - started_at) * 1000)
        result = {
            "accepted": False,
            "similarity_score": round(stage_a_similarity, 4),
            "processing_ms": processing_ms,
        }
        if include_breakdown:
            result["breakdown"] = {
                "fast_similarity": round(stage_a_similarity, 4),
                "fast_rejected": True,
                "config": config,
            }
        return result

    reference_final = _prepare_grayscale(reference_image_file, FINAL_SIZE)
    attempt_final = _prepare_grayscale(attempt_image_file, FINAL_SIZE)

    base_similarity = _best_shift_similarity(
        reference_final,
        attempt_final,
        max_shift=config["final_max_shift"],
        step=config["final_step"],
    )

    edge_reference = reference_final.filter(ImageFilter.FIND_EDGES)
    edge_attempt = attempt_final.filter(ImageFilter.FIND_EDGES)
    edge_similarity = _best_shift_similarity(
        edge_reference,
        edge_attempt,
        max_shift=config["edge_max_shift"],
        step=config["edge_step"],
    )

    hist_similarity = _histogram_similarity(reference_final, attempt_final)
    grid_similarity = _grid_mean_similarity(reference_final, attempt_final)

    unpenalized_similarity = (
        (config["base_weight"] * base_similarity)
        + (config["edge_weight"] * edge_similarity)
        + (config["histogram_weight"] * hist_similarity)
        + (config["grid_weight"] * grid_similarity)
    ) / config["weight_total"]

    # Penalize false positives where broad tonal or spatial structure diverges.
    combined_similarity = unpenalized_similarity
    histogram_penalty_applied = hist_similarity < config["histogram_penalty_threshold"]
    grid_penalty_applied = grid_similarity < config["grid_penalty_threshold"]
    if histogram_penalty_applied:
        combined_similarity *= config["histogram_penalty_multiplier"]
    if grid_penalty_applied:
        combined_similarity *= config["grid_penalty_multiplier"]

    combined_similarity = max(0.0, min(1.0, combined_similarity))

    processing_ms = int((time.perf_counter() - started_at) * 1000)
    result = {
        "accepted": combined_similarity >= threshold,
        "similarity_score": round(combined_similarity, 4),
        "processing_ms": processing_ms,
    }
    if include_breakdown:
        result["breakdown"] = {
            "fast_similarity": round(stage_a_similarity, 4),
            "base_similarity": round(base_similarity, 4),
            "edge_similarity": round(edge_similarity, 4),
            "histogram_similarity": round(hist_similarity, 4),
            "grid_similarity": round(grid_similarity, 4),
            "unpenalized_similarity": round(unpenalized_similarity, 4),
            "histogram_penalty_applied": histogram_penalty_applied,
            "grid_penalty_applied": grid_penalty_applied,
            "fast_rejected": False,
            "config": config,
        }
    return result
