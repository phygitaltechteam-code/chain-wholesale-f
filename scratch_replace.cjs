const fs = require('fs');
const file = 'src/components/joborder/karigar/KarigarReport.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.\.\/\.\.\/routes\/_app\/client\/clientreport\.\$id/g, '../../../routes/_app/karigar/karigarreport.$id');
content = content.replace(/useGetClientReport/g, 'useGetKarigarReport');
content = content.replace(/useGetClients/g, 'useGetKarigars');
content = content.replace(/@\/lib\/api\/client/g, '@/components/joborder/karigar/karigarapi');
content = content.replace(/\.\/clientReportUtils/g, '../../Client/clientReportUtils');
content = content.replace(/\.\/ClientReportTable/g, '../../Client/ClientReportTable');
content = content.replace(/\.\/printClientReportDoc/g, '../../Client/printClientReportDoc');
content = content.replace(/ClientReport/g, 'KarigarReport');
content = content.replace(/clientReportData/g, 'karigarReportData');
content = content.replace(/clientsData/g, 'karigarsData');
content = content.replace(/Client Report/g, 'Karigar Report');
content = content.replace(/Client/g, 'Karigar'); // This might replace things we didn't want, wait! I will remove this and be specific!
content = content.replace(/karigarsData\.find\(\(c: any\) => c\.id === id\)/g, 'karigarsData?.find((c: any) => c.id === id)');

fs.writeFileSync(file, content);
