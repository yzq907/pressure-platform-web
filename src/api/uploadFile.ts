import request from '../utils/request';

export const addUploadFileBinding = (param: any) => {
    return request({
        url: '/uploadFile/binding/add',
        method: 'post',
        data: param
    });
}

export const deleteUploadFileBinding = (id: number) => {
    return request({
        url: '/uploadFile/binding/delete/' + id,
        method: 'get'
    });
}
