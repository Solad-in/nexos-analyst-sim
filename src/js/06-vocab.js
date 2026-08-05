"use strict";
/* ============ словарь данных ============ */
// Значения внутри таблиц — города, имена агентов, каналы, темы тикетов — раньше лежали
// кириллическими литералами прямо в генераторах. Для английской версии это не просто перевод
// интерфейса: выгрузка, где половина значений на другом языке, нечитаема, а именно её игрок
// и разбирает. Поэтому все данные собраны здесь и выбираются по языку.
//
// Списки в языках соответствуют друг другу по длине и смыслу, но не обязаны быть переводом
// слово в слово: «Пермь» → «Austin» — это подбор правдоподобного города, а не перевод.
const VOCAB={
  ru:{
    agents:['Аня','Боря','Света','Дима'],
    firstNames:['Анна','Борис','Светлана','Дмитрий','Марина','Игорь','Ольга','Павел','Юлия','Тимур'],
    lastNames:['Орлова','Гринько','Ким','Лемм','Соколов','Верещагин','Данилова','Мухин','Королёва','Ситников'],
    cities:['Москва','Санкт-Петербург','Казань','Новосибирск','Пермь','Тюмень','Екатеринбург','Сочи'],
    channels:['Google Ads','Facebook Ads','Email','Директ','TikTok Ads'],
    ticketTopics:['оплата','доставка','возврат','доступ','интеграция'],
    departments:['Аналитика','Маркетинг','Продажи','Поддержка','Разработка'],
    segments:['SMB','Enterprise','Startup'],
    companyWords:['Вектор','Ритм','Астра','Кедр','Панорама','Сфера','Гранит','Лагуна'],
    companyName:(word,i)=> 'ООО «'+word+'-'+i+'»',
    customerName:i=> 'Клиент '+i,
    campaignName:i=> 'Кампания '+i,
    managerName:i=> 'Менеджер '+i,
    landingPages:['/pricing','/landing-a','/landing-b','/webinar','/about','/contact','/faq','/careers'],
  },
  en:{
    agents:['Amy','Ben','Chloe','Dan'],
    firstNames:['Anna','Brian','Sophie','David','Marina','Ivan','Olivia','Paul','Julia','Tim'],
    lastNames:['Smith','Green','Kim','Lehman','Falcone','Barnes','Danvers','Moore','Kingsley','Sutton'],
    cities:['New York','Boston','Chicago','Seattle','Austin','Denver','Portland','Miami'],
    channels:['Google Ads','Meta Ads','Email','Bing Ads','TikTok Ads'],
    ticketTopics:['billing','delivery','refund','access','integration'],
    departments:['Analytics','Marketing','Sales','Support','Engineering'],
    segments:['SMB','Enterprise','Startup'],
    companyWords:['Vector','Rhythm','Astra','Cedar','Panorama','Sphere','Granite','Lagoon'],
    companyName:(word,i)=> word+'-'+i+' Inc.',
    customerName:i=> 'Customer '+i,
    campaignName:i=> 'Campaign '+i,
    managerName:i=> 'Rep '+i,
    landingPages:['/pricing','/landing-a','/landing-b','/webinar','/about','/contact','/faq','/careers'],
  },
};
// Отдельно от tr(): это не подписи интерфейса, а содержимое таблиц, и возвращает оно списки.
function vocab(key){
  const pack=VOCAB[locale]||VOCAB.ru;
  return (key in pack)?pack[key]:VOCAB.ru[key];
}
