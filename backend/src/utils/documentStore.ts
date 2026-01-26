type Doc = {
  url: string;
  uploadedAt: Date;
};

const documentStore = new Map<string, Doc[]>();

export const addDocument = (sessionId: string, url: string) => {
  const docs = documentStore.get(sessionId) || [];
  docs.push({ url, uploadedAt: new Date() });
  documentStore.set(sessionId, docs);
};

export const getDocuments = (sessionId: string) => {
  return documentStore.get(sessionId) || [];
};
