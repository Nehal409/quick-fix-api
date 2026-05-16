export interface ResponseData {
    data?: any[];
    message: string;
    success?: boolean;
    error?: Record<string, any> | string | null;
}
