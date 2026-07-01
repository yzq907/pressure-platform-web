import request from '../utils/request';
import {AxiosResponse} from "axios";

export const getPublicCsvList = (param: any) => {
    return request({
        url: '/csv/resource/list',
        method: 'get',
        params: param
    });
}

export const uploadPublicCsv = (body: any, overwrite = false) => {
    return request({
        url: '/csv/resource/upload',
        method: 'post',
        headers:{
            'Content-Type':'multipart/form-data',
        },
        params: overwrite ? { overwrite: true } : {},
        data: body
    })
}

export const deletePublicCsv = (filename: string, force = false) => {
    return request({
        url: '/csv/resource/delete/' + encodeURIComponent(filename),
        method: 'get',
        params: force ? { force: true } : {}
    });
}

export const viewPublicCsv = (filename: string) => {
    return request({
        url: '/csv/resource/view/' + encodeURIComponent(filename),
        method: 'get'
    });
}

export const updatePublicCsv = (filename: string, content: string) => {
    return request({
        url: '/csv/resource/update/' + encodeURIComponent(filename),
        method: 'post',
        data: content,
        headers: { 'Content-Type': 'text/plain' }
    });
}

export const addCsvBinding = (param: any) => {
    return request({
        url: '/csv/binding/add',
        method: 'post',
        data: param
    });
}

export const deleteCsvBinding = (id: number) => {
    return request({
        url: '/csv/binding/delete/' + id,
        method: 'get'
    });
}

export const updateCsvBindingStrategy = (id: number, distributionStrategy: string) => {
    return request({
        url: '/csv/binding/updateStrategy/' + id,
        method: 'post',
        data: { distributionStrategy }
    });
}

export const downloadPublicCsv = async (filename: string) => {
    try {
        const response: AxiosResponse<Blob> = await request({
            url: '/csv/resource/download/' + encodeURIComponent(filename),
            method: 'get',
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        return {success: true};
    } catch (error) {
        return {success: false, error};
    }
};
