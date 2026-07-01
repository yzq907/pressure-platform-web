export interface JmxItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    jmxDir: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface JarItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    jarDir: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface CsvItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    csvDir: string;
    distributionStrategy: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface PublicCsvItem {
    id: number;
    filename: string;
    fileType: string;
    description: string;
    fileSize: number;
    referenceCount: number;
    csvReferenceCount: number;
    uploadFileReferenceCount: number;
    exists: boolean;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface CsvBindingItem {
    id: number;
    testCaseId: number;
    filename: string;
    description: string;
    distributionStrategy: string;
    exists: boolean;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface UploadFileItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    fileDir: string;
    testCaseId: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface UploadFileBindingItem {
    id: number;
    testCaseId: number;
    filename: string;
    description: string;
    exists: boolean;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}
