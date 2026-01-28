"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocuments = exports.addDocument = void 0;
const documentStore = new Map();
const addDocument = (sessionId, url) => {
    const docs = documentStore.get(sessionId) || [];
    docs.push({ url, uploadedAt: new Date() });
    documentStore.set(sessionId, docs);
};
exports.addDocument = addDocument;
const getDocuments = (sessionId) => {
    return documentStore.get(sessionId) || [];
};
exports.getDocuments = getDocuments;
