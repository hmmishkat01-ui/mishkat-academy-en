import { localDB } from './localStore';

const UploadFile = ({ file }) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve({ file_url: e.target.result });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const base44 = {
  entities: localDB,
  auth: {
    me: async () => ({ id: 'local-user', email: 'admin@mishkat.local', name: 'Admin' }),
    logout: () => { window.location.reload(); },
    redirectToLogin: () => {},
  },
  integrations: {
    Core: {
      UploadFile,
      InvokeLLM: async () => {},
      SendEmail: async () => {},
      SendSMS: async () => {},
      GenerateImage: async () => {},
      ExtractDataFromUploadedFile: async () => {},
    }
  }
};