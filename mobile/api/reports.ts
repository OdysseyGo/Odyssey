import { apiRequest } from './APIClient';

export type ReportContentType = 'TOUR' | 'REVIEW' | 'USER';

export type ReportCategory =
  | 'INAPPROPRIATE'
  | 'HATE_OR_HARASSMENT'
  | 'SPAM'
  | 'MISLEADING'
  | 'SAFETY'
  | 'PRIVACY'
  | 'OTHER';

export type SubmitReportPayload = {
  content_type: ReportContentType;
  content_id: number;
  category: ReportCategory;
  reason: string;
};

export type SubmittedReport = SubmitReportPayload;

export async function submitReport(
  payload: SubmitReportPayload,
  signal?: AbortSignal
): Promise<SubmittedReport> {
  return apiRequest<SubmittedReport, SubmitReportPayload>({
    method: 'POST',
    url: '/api/reports/',
    data: payload,
    auth: true,
    signal,
  });
}
