import request from '../utils/request';

export const getAuditLogList = (param: any) => {
    return request({
        url: '/audit/list',
        method: 'get',
        params: param
    });
}
