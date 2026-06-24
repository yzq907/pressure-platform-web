import request from '../utils/request';
import {AxiosResponse} from "axios";

export const getReportList = (param: any) => {
    return request({
        url: '/report/listByTestCase',
        method: 'get',
        params: param
    });
}

export const getReportListAll = (param: any) => {
    return request({
        url: '/report/list',
        method: 'get',
        params: param
    });
}

export const getReportListByTestCase = (param: any) => {
    return request({
        url: '/report/listByTestCase',
        method: 'get',
        params: param
    });
}

export const getReportStats = (param: any) => {
    return request({
        url: '/report/stats',
        method: 'get',
        params: param
    });
}

export const getJMeterResultByReport = (reportId: number) => {
    return request({
        url: '/report/getJMeterResult/' + reportId,
        method: 'get'
    });
}

export const getMetrics = (reportId: number, window: number = 5) => {
    return request({
        url: '/report/getMetrics/' + reportId,
        method: 'get',
        params: { window }
    });
}

export const getTransactionStats = (reportId: number) => {
    return request({
        url: '/report/transactionStats/' + reportId,
        method: 'get'
    });
}

export const getTransactionMetrics = (reportId: number, window: number = 60) => {
    return request({
        url: '/report/transactionMetrics/' + reportId,
        method: 'get',
        params: { window }
    });
}

export const getTransactionTrend = (reportId: number, window: number = 60) => {
    return request({
        url: '/report/transactionTrend/' + reportId,
        method: 'get',
        params: { window }
    });
}

export const getResourceTargets = (reportId: number) => {
    return request({
        url: '/report/resourceTargets/' + reportId,
        method: 'get'
    });
}

export const getResourceMetrics = (reportId: number, step?: number, instance?: string, forceRefresh = false) => {
    const params: Record<string, any> = {};
    if (step !== undefined && step !== null) {
        params.step = step;
    }
    if (instance) {
        params.instance = instance;
    }
    if (forceRefresh) {
        params.forceRefresh = true;
    }
    return request({
        url: '/report/resourceMetrics/' + reportId,
        method: 'get',
        params
    });
}

export const downloadReport = async (id: number) => {
    try {
        const response: AxiosResponse<Blob> = await request({
            url: '/report/download/' + id,
            method: 'get',
            responseType: 'blob', // Important: Set responseType to 'blob' to handle binary data
        });

        // Create a blob URL for the downloaded file
        const url = window.URL.createObjectURL(new Blob([response.data]));

        // Create a link and trigger a download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', id + '_data.zip'); // Set the filename here
        document.body.appendChild(link);
        link.click();

        // Clean up the object URL after the download
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};

// export const downloadReport = (id: number) => {
//     return request({
//         url: '/report/download/' + id,
//         method: 'get'
//     });
// }

export const getLog = (id: number) => {
    return request({
        url: '/report/getJMeterLog/' + id,
        method: 'get'
    });
}

export const cleanReport = (id: number) => {
    return request({
        url: '/report/clean/' + id,
        method: 'get'
    });
}

export const viewReport = (id: number) => {
    return request({
        url: '/report/view/' + id,
        method: 'get'
    });
}

export const getGrafanaUrl = (id: number) => {
    return request({
        url: '/report/grafana/' + id,
        method: 'get'
    });
}

export const getArtifacts = (id: number) => {
    return request({
        url: '/report/artifacts/' + id,
        method: 'get'
    });
}

export const downloadArtifact = async (id: number, name: string) => {
    try {
        const response: AxiosResponse<Blob> = await request({
            url: '/report/artifacts/' + id + '/download',
            method: 'get',
            params: { name },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};

export const compareReports = (baseId: number, targetId: number, window: number = 5) => {
    return request({
        url: '/report/compare',
        method: 'get',
        params: { baseId, targetId, window }
    });
}
