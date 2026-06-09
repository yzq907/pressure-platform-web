import request from '../utils/request';
import {AxiosResponse} from "axios";

export const getUploadFileList = (param: any) => {
    return request({
        url: '/uploadFile/list',
        method: 'get',
        params: param
    });
}

export const deleteUploadFile = (id: number) => {
    return request({
        url: '/uploadFile/delete/' + id,
        method: 'get'
    });
}

export const uploadUploadFile = (testCaseId: number, body: any) => {
    return request({
        url: '/uploadFile/upload/' + testCaseId,
        method: 'post',
        headers:{
            'Content-Type':'multipart/form-data',
        },
        data: body
    })
}

export const downloadUploadFile = async (id: number, fileName: string) => {
    try {
        const response: AxiosResponse<Blob> = await request({
            url: '/uploadFile/download/' + id,
            method: 'get',
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);

        return {success: true};
    } catch (error) {
        return {success: false, error};
    }
};
