import request from '../utils/request';

export const getAuditLogList = (param: any) => {
    return request({
        url: '/audit/list',
        method: 'get',
        params: param
    });
}

export const cleanAuditLogs = (ids: number[]) => {
    return request({
        url: '/audit/cleanBatch',
        method: 'post',
        data: { ids }
    });
}
