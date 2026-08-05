"use strict";
/* ============ локализация ============ */
// Строки живут в словарях по языкам. Значением может быть строка с подстановками {имя}
// или функция — второе нужно там, где грамматика у языков разная: согласование числительных
// по-русски требует трёх форм, по-английски двух, и вынести это в данные не получается.
//
// Язык выбирается на экране входа и запоминается в карьере. Переключать его посреди карьеры
// нельзя, и это осознанно: тексты задач генерируются один раз и хранятся в сохранении
// готовыми строками, так что задним числом они бы не перевелись. Хочешь другой язык —
// начинай новую карьеру, о чём на экране входа и написано.
const LOCALE_KEY='dataco-nexos:locale';
const LOCALES_AVAILABLE=[{code:'ru', label:'Рус'}, {code:'en', label:'Eng'}];
let locale='ru';

// Русское согласование: 21 день, 22 дня, 25 дней.
function pluralRu(n, one, few, many){
  const a=Math.abs(n)%100, b=a%10;
  if(a>10 && a<20) return many;
  if(b>1 && b<5) return few;
  if(b===1) return one;
  return many;
}
function pluralEn(n, one, many){ return Math.abs(n)===1?one:many; }

const LOCALES={
  ru:{
    workDays:n=> n+' '+pluralRu(n,'рабочий день','рабочих дня','рабочих дней'),

    'login.new':'🆕 Новая карьера',
    'login.load':'📂 Продолжить карьеру',
    'login.exit':'🚪 Выход',
    'login.namePlaceholder':'Как тебя зовут?',
    'login.start':'Начать карьеру',
    'login.back':'← Назад',
    'login.bye':'👋 До встречи! Прогресс уже сохранён — можешь закрыть эту вкладку в любой момент.',
    'login.langNote':'Язык выбирается один раз на карьеру.',
    'boot.loading':'Загрузка DataCo Workstation',

    'icon.ref':'Справочник',
    'menu.ref':'📚 SQL-справочник',
    'menu.sandbox':'🧪 Песочница',
    'menu.endshift':'🌙 Закончить смену',
    'menu.save':'💾 Сохранить сейчас',
    'menu.logout':'🔓 Выйти из карьеры',
    'menu.profile':'👤 Профиль',
    'menu.start':'▦ Меню',

    'toast.newChat':p=>'Новое сообщение от '+p.name,
    'toast.newMail':p=>'Новое письмо от '+p.name,
    'toast.mailFrom':p=>'Письмо от '+p.name,
    'toast.correct':p=>'✅ Верно! +'+p.rep+' репутации, +$'+p.money+' к премии (выплата через '+p.days+').',
    'toast.shiftDone':p=>'День '+p.day+' закрыт: отчётов сдано — '+p.reports+'. Энергия восстановлена.',
    'toast.saved':'Прогресс сохранён.',
    'feedback.correct':p=>'Верно! +'+p.rep+' репутации, +$'+p.money+' к премии.',

    'prof.dataAnalyst':'Дата-аналитик',
    'prof.productManager':'Продакт-менеджер',
    'prof.backendDev':'Backend-разработчик',
    'prof.soon':'скоро',
    'pay.toast':p=>'💸 Зарплата: +$'+p.total,
    'pay.subject':p=>'Расчётный лист · период '+p.n,
    'pay.body':p=>'Закрыт расчётный период — '+p.period+' (по '+p.day+'-й день включительно).\n\n'+
      'Должность: '+p.level+'\nОклад: $'+p.salary+'\nПремии за задачи и повышения: $'+p.bonus+
      '\nИтого к выплате: $'+p.total+'\n\nДеньги уже на счету. Следующая выплата — через '+p.period+'.',
    'promo.subject':'Повышение 🎉',
    'promo.body':p=>'Поздравляю с повышением — теперь твоя должность «'+p.level+'»! Новый оклад — $'+p.salary+
      ' в месяц, он начнёт действовать сразу. Премия за повышение $'+p.bonus+' придёт вместе с ближайшей зарплатой — через '+p.days+'.',
    'nudge.subject':'Как продвигается адаптация?',
    'nudge.body':p=>'Заметила, что задача «'+p.title+'» заняла несколько попыток. Если снова будет туго — сверься со схемой таблицы и подсказкой в QueryBench, или напиши в PulseChat.',
    'praise.subject':'Отличная работа 👏',
    'praise.body':p=>'Видела запрос по «'+p.title+'» — чисто и по делу. Продолжай в том же духе.',
    'rest.chat':'Ты сегодня много вытянул — энергии почти не осталось. Закончи смену через Меню, задачи подождут до завтра.',
    'director.subject':'Как дела в целом?',
    'director.body':'Просто хотела сказать — команда рада, что ты у нас. Если где-то нужна помощь по SQL, обращайся к Ксении.',
    'style.intro':p=>'Глянула твой запрос по задаче «'+p.title+'» — считает правильно, принимаю. Одно замечание на будущее: '+p.note,

    'mail.pick':'Выбери письмо слева.',
    'mail.from':p=>'От: '+p.name+' · '+p.role,
    'chat.reply.take':'Взял в работу, скоро пришлю.',
    'chat.reply.clarify':'А можно чуть подробнее — с чего тут начать?',
    'chat.reply.hi':'Привет! Как дела?',
    'chat.reply.thanks':'Спасибо!',
    'chat.reply.offer':'Если что-то нужно посчитать — пиши, разберусь.',
    'chat.hintReply':p=>'Конечно. Смотри: '+p.hint,

    'files.title':n=>'🗂️ Отчёты ('+n+')',
    'files.empty':'Пока ни одного отчёта. Они появляются здесь автоматически, когда ты сдаёшь задачу.',
    'files.nothingFound':'Ничего не найдено.',
    'files.search':'Поиск по задаче или запросу',
    'files.pick':'Выбери отчёт слева.',
    'files.meta':p=>'День '+p.day+' · '+p.rows+' строк · '+p.cols+' колонок',
    'files.download':'⬇ Скачать CSV',
    'files.copySql':'📋 Скопировать SQL',
    'files.exportAll':'⬇ Выгрузить список',
    'files.truncated':'В отчёте сохранены первые 20 строк результата — столько же попадёт в CSV.',
    'files.exported':p=>'Список из '+p.n+' отчётов выгружен.',
    'files.oneExported':'Отчёт выгружен в CSV.',
    'files.sqlCopied':'SQL скопирован в буфер обмена.',
    'files.sqlCopyFail':'⚠ Браузер не дал доступ к буферу — скопируй запрос вручную.',
    'files.allSuffix':'_отчёты.csv',
    'files.dayPrefix':'день',
    'files.colDay':'день', 'files.colTask':'задача', 'files.colRows':'строк', 'files.colSql':'sql',
    'files.downloadFail':p=>'⚠ Не удалось скачать файл: '+p.msg,

    'prof.employee':'Сотрудник',
    'prof.career':'Карьера',
    'prof.money':'Деньги',
    'prof.mastery':'Освоенность тем',
    'prof.masteryNote':'Считается по среднему числу попыток. Темы, которые даются тяжелее, чаще возвращаются в работу.',
    'prof.repLine':p=>'Репутация '+p.rep+' · '+p.line,
    'prof.toNext':p=>'До «'+p.level+'» — '+p.rep+' репутации',
    'prof.maxLevel':'Максимальная должность достигнута',
    'prof.days':n=>pluralRu(n,'день','дня','дней')+' в компании',
    'prof.solved':n=>pluralRu(n,'задача сдана','задачи сдано','задач сдано'),
    'prof.reports':n=>pluralRu(n,'отчёт','отчёта','отчётов')+' в FileDock',
    'prof.attemptsPer':'попыток на задачу',
    'prof.hints':n=>pluralRu(n,'подсказка куплена','подсказки куплено','подсказок куплено'),
    'prof.paydays':n=>pluralRu(n,'зарплата получена','зарплаты получено','зарплат получено'),
    'prof.inAccount':'на счету',
    'prof.basePay':'оклад',
    'prof.bonusPending':'премия к выплате',
    'prof.paydayIn':'зарплата через',
    'prof.notTried':'не проходили',
    'prof.solid':'уверенно',
    'prof.ok':'нормально',
    'prof.revisit':'стоит повторить',
    'prof.attemptsShort':n=>n+' поп.',

    'diag.empty':'Запрос отработал, но не вернул ни одной строки — условие отбора отсекает вообще всё. Проверь значения и границы диапазона.',
    'diag.scalarMany':n=>'Нужно одно итоговое число, а вернулось строк: '+n+'. Похоже, не хватает агрегатной функции — сейчас запрос отдаёт отдельные строки, а не сводку.',
    'diag.scalarNotNumber':'В результате нет ни одного числа, а ответом должно быть числовое значение.',
    'diag.scalarOff':'Одна строка есть, но число не сходится. Проверь, ту ли колонку ты агрегируешь и не попадают ли в расчёт лишние строки.',
    'diag.countOff':'Считаешь правильно по форме, но число не сходится — условие отбора захватывает не те строки.',
    'diag.countRows':n=>'Количество не сходится: сейчас в результате строк — '+n+'. Проверь условие отбора, скорее всего оно ловит лишнее или отсекает нужное.',
    'diag.groupsNone':'Вернулась одна строка вместо разбивки — похоже, нет GROUP BY, и агрегат посчитан по всей таблице сразу.',
    'diag.groupsCount':n=>'Групп получилось '+n+' — это не то количество, которое должно выйти. Проверь, по какой колонке идёт группировка и не отсекает ли лишнее фильтр.',
    'diag.groupsNoNumber':'Группы выделены, но числовой колонки в результате нет — не хватает агрегатной функции.',
    'diag.groupsValues':'Сами группы правильные, а числа в них не сходятся. Проверь, какую колонку ты агрегируешь и какой функцией.',
    'diag.keysCount':n=>'В ответе строк: '+n+' — правильное условие отбора даёт другое количество. Проверь оператор и границы.',
    'diag.keysValues':'Количество строк верное, но набор значений другой — условие цепляет не те строки.',
    'diag.bestMany':n=>'Вернулось строк: '+n+', а нужен один лучший результат. Добавь сортировку по нужной величине и LIMIT 1.',
    'diag.bestOff':'Строка одна, но результат не тот. Проверь направление сортировки (DESC или ASC) и саму формулу расчёта.',
    'diag.generic':'Пока не то. Проверь условие отбора, группировку и агрегатную функцию.',

    'style.star':'ты выгрузил всю таблицу через SELECT *. В рабочем отчёте так лучше не делать: перечисляй колонки явно — тогда результат не поедет, если в таблицу добавят поле, и коллеге сразу видно, что именно ты считал.',
    'style.alias':'агрегат без псевдонима даёт колонку с машинным именем вроде sum_amount. Добавляй AS с понятным названием — отчёт потом читают люди, а не только ты.',
    'style.orchain':'несколько OR по одной и той же колонке короче и надёжнее записать через IN (...) — меньше шансов ошибиться в скобках, когда значений станет пять.',
    'style.limitnoorder':'LIMIT без ORDER BY возвращает произвольные строки — сегодня одни, завтра другие. Если нужен «топ», сортировку надо задавать явно.',

    'storage.label.cloud':'☁️ облако (Claude)',
    'storage.label.local':'💻 в этом браузере',
    'storage.label.memory':'⚠️ только сессия',
    'storage.note.cloud':'Прогресс сохраняется в облако Claude — доступен из любого устройства с этим аккаунтом.',
    'storage.note.local':'Прогресс сохраняется в этом браузере на этом устройстве (localStorage). В режиме инкогнито или после очистки данных браузера сохранения будут потеряны.',
    'storage.note.memory':'⚠ Хранилище недоступно в этом окружении — прогресс не переживёт перезагрузку страницы.',
    'save.emptyResult':'storage.set вернул пустой результат',
    'save.notFound':'запись не найдена',
    'save.failed':p=>'⚠ Не удалось сохранить: '+p.msg,
    'save.loadFailed':p=>'⚠ Не удалось загрузить карьеру: '+p.msg,
    'save.corrupt':p=>'⚠ Сохранение повреждено: '+p.msg,
    'save.deleteFailed':p=>'⚠ Не удалось удалить: '+p.msg,
    'open.qb':'Открыть в QueryBench →',
    'open.task':'Открыть задачу →',
    'open.chart':'Открыть в ChartLab →',
    'load.loading':'Загрузка…',
    'load.none':'Пока нет сохранённых карьер.',
    'load.day':n=>'День '+n,
    'load.play':'Играть',
    'load.delete':'Удалить',
    'load.confirmDelete':'Удалить безвозвратно?',
    'load.yes':'Да',
    'load.cancel':'Отмена',
    'login.defaultName':'Стажёр',
    'login.pickProfession':'Выбери профессию.',
    'login.startHint':'👋 Начни с PulseChat — Ксения уже пишет тебе.',
    'login.welcomeBack':p=>'С возвращением, '+p.name+'!',

    'dash.title':'Профиль сотрудника',
    'dash.reputation':'Репутация',
    'dash.energy':'Энергия',
    'dash.balance':'Баланс',
    'dash.salary':'Оклад',
    'dash.bonus':'Премия к выплате',
    'dash.payday':'Зарплата через',
    'dash.day':'День',
    'dash.storage':'Сохранение',
    'dash.openProfile':'Открыть профиль →',
    'dash.perMonth':'/ мес',
    'dash.today':'сегодня',

    'app.ref':'SQL-справочник',
    'app.profile':'Профиль',
    'badge.exam':'ЭКЗАМЕН',

    'task.from':p=>'Задача от '+p.name+' ('+p.role+')',
    'task.open':n=>'📋 В работе ('+n+')',
    'task.done':n=>'✓ Выполнено ('+n+')',
    'task.noneOpen':'Активных задач нет. Жди сообщения от коллег — или загляни в PulseChat и InboxPro.',
    'task.noneDone':'Пока пусто.',
    'task.pick':'Выбери задачу слева.',
    'task.meta':p=>'От: '+p.from+' · '+p.role+'<br>Канал: '+p.channel+' · Попыток: '+p.attempts,
    'task.reward':p=>'Награда: +'+p.rep+' rep, +$'+p.money+' · Расход энергии: '+p.energy+'%',
    'task.completed':'✓ Задача выполнена',
    'task.statusDone':'готово',
    'task.statusOpen':'в работе',
    'task.noEnergy':p=>'Не хватает энергии ('+p.have+'% из '+p.need+'%). Закончи смену через Меню.',

    'qb.schema':'Схема',
    'qb.samples':'примеры:',
    'qb.rowCount':n=>'строк: '+n,
    'qb.run':'▶ Выполнить',
    'qb.submit':'✓ Отправить ответ',
    'qb.csv':'⬇ CSV',
    'qb.accepted':'✓ Ответ принят',
    'qb.shortcutsTask':'Ctrl+Enter — выполнить · Ctrl+S — отправить',
    'qb.shortcutsSandbox':'Ctrl+Enter — выполнить',
    'qb.doneNote':'Задача сдана — запрос можно доработать для себя',
    'qb.emptyResult':'Запрос выполнен, но результат пуст.',
    'qb.sandboxTitle':'🧪 Песочница · база DataCo',
    'qb.sandboxNote':'Активной задачи нет — это рабочая копия базы компании. Здесь можно писать любые запросы и ничего не сломать: данные никуда не отправляются и на прогресс не влияют. Задачи открываются из PulseChat, InboxPro или TaskBoard.',
    'qb.csvDone':'Результат запроса выгружен в CSV.',
    'csv.sandboxFile':'песочница',
    'csv.resultSuffix':'_результат.csv',
    'hint.l1':'💡 Намёк',
    'hint.l2':'🧩 Каркас запроса',
    'hint.l3':'📝 Готовый запрос',
    'hint.free':'бесплатно',
    'hint.bought':p=>'Подсказка куплена: −$'+p.price,
    'hint.tooPoor':'Не хватает денег на подсказку.',
    'hint.noMoney':p=>'Не хватает денег: на счету $'+p.money+'. Зарплата через '+p.days+'.',
    'hint.missing':'Подсказка к этой задаче пока не написана.',
    'hint.examCosts':'Это экзамен — подсказки здесь стоят вдвое дороже.',
    'energy.blocked':p=>'🪫 Энергии осталось '+p.have+'%, а задача требует '+p.need+'%. Решать можно, но сдать ответ не получится — закончи смену через <b>Меню → Закончить смену</b>.',
    'energy.low':p=>'🔋 Энергия на исходе: '+p.have+'%. Задача съест '+p.need+'%.',
    'energy.cantSubmit':p=>'🪫 Не хватает энергии ('+p.have+'% из '+p.need+'%). Закончи смену через Меню — черновик сохранится.',

    'choice.multi':'можно отметить несколько',
    'choice.hintMulti':'Отметь все подходящие варианты и отправь ответ',
    'choice.hintSingle':'Выбери вариант и отправь ответ',
    'choice.doneNote':'Задача сдана — разбор всех вариантов ниже',
    'choice.notThis':'Этот вариант не подходит.',
    'choice.missing':n=>'Всё отмеченное — верно, но отмечено не всё: осталось найти ещё '+n+' '+pluralRu(n,'вариант','варианта','вариантов')+'. Перечитай остальные.',

    'chart.kind':'Тип графика',
    'chart.x':'По горизонтали',
    'chart.y':'По вертикали',
    'chart.data':'Данные',
    'chart.line':'📈 Линия',      'chart.lineHint':'как величина менялась',
    'chart.bar':'📊 Столбцы',      'chart.barHint':'что больше, что меньше',
    'chart.pie':'🥧 Круг',         'chart.pieHint':'какая доля от целого',
    'chart.preview':'Выбери тип графика и обе оси — предпросмотр появится здесь.',
    'chart.hintBuild':'Собери график и отправь ответ',
    'chart.doneNote':'Задача сдана',
    'chart.emptyTitle':'Активной задачи для ChartLab нет.',
    'chart.emptySub':'Задачи на графики приходят от коллег в PulseChat и InboxPro — открой задачу оттуда или из TaskBoard.',
    'chart.wrongKind':'Этот тип графика не отвечает на заданный вопрос.',
    'chart.wrongX':p=>'Тип графика верный. Но по горизонтальной оси должно быть то, вдоль чего идёт сравнение, — сейчас там «'+p.x+'».',
    'chart.wrongY':p=>'Тип графика и горизонтальная ось верные. Осталось выбрать ту величину, которую просят показать: «'+p.y+'» — не она.',

    'judg.clarifyQuestion':'Задача сформулирована расплывчато. Какой вопрос надо задать первым — до того, как садиться считать?',
    'judg.clarifyReview':p=>'Верный вопрос по задаче «'+p.title+'». '+p.why,
    'judg.conclusionQuestion':'Данные уже посчитаны. Какой вывод из них действительно следует?',
    'judg.conclusionReview':p=>'Верный вывод по задаче «'+p.title+'». '+p.why,
    'judg.abQuestion':'Что ответить маркетингу?',
    'judg.abReview':p=>'По тесту «'+p.title+'» ты ответил правильно. '+p.why,
    'judg.dqQuestion':'Что в этой выгрузке помешает считать?',
    'judg.dqReview':p=>'По выгрузке «'+p.title+'» ты нашёл всё. Привычка смотреть на данные до того, как писать запрос, экономит больше времени, чем любая оптимизация: посчитать по грязным данным быстро — значит быстро получить неверную цифру.',
    'judg.dashQuestion':'Какие показатели вывести на дашборд?',
    'judg.dashReview':p=>'Состав дашборда «'+p.title+'» ты собрал верно. Главное правило: дашборд отвечает на конкретный вопрос, а не показывает всё, что удалось посчитать. Каждый лишний график делает нужные менее заметными.',
    'chart.question':'Собери график, который ответит на вопрос.',
  },
  en:{
    workDays:n=> n+' '+pluralEn(n,'business day','business days'),

    'login.new':'🆕 New career',
    'login.load':'📂 Continue career',
    'login.exit':'🚪 Quit',
    'login.namePlaceholder':"What's your name?",
    'login.start':'Start career',
    'login.back':'← Back',
    'login.bye':'👋 See you around. Your progress is saved — you can close this tab any time.',
    'login.langNote':'Language is picked once per career.',
    'boot.loading':'Loading DataCo Workstation',

    'icon.ref':'Reference',
    'menu.ref':'📚 SQL reference',
    'menu.sandbox':'🧪 Sandbox',
    'menu.endshift':'🌙 End the shift',
    'menu.save':'💾 Save now',
    'menu.logout':'🔓 Log out of career',
    'menu.profile':'👤 Profile',
    'menu.start':'▦ Menu',

    'toast.newChat':p=>'New message from '+p.name,
    'toast.newMail':p=>'New email from '+p.name,
    'toast.mailFrom':p=>'Email from '+p.name,
    'toast.correct':p=>'✅ Correct! +'+p.rep+' reputation, +$'+p.money+' bonus (paid out in '+p.days+').',
    'toast.shiftDone':p=>'Day '+p.day+' closed: '+p.reports+' '+pluralEn(p.reports,'report','reports')+' delivered. Energy restored.',
    'toast.saved':'Progress saved.',
    'feedback.correct':p=>'Correct! +'+p.rep+' reputation, +$'+p.money+' bonus.',

    'prof.dataAnalyst':'Data analyst',
    'prof.productManager':'Product manager',
    'prof.backendDev':'Backend developer',
    'prof.soon':'soon',
    'pay.toast':p=>'💸 Payday: +$'+p.total,
    'pay.subject':p=>'Payslip · period '+p.n,
    'pay.body':p=>'Pay period closed — '+p.period+' (through day '+p.day+' inclusive).\n\n'+
      'Position: '+p.level+'\nBase pay: $'+p.salary+'\nTask and promotion bonuses: $'+p.bonus+
      '\nTotal paid: $'+p.total+'\n\nThe money is already in your account. Next payment in '+p.period+'.',
    'promo.subject':'Promotion 🎉',
    'promo.body':p=>'Congratulations on the promotion — your position is now “'+p.level+'”. New base pay is $'+p.salary+
      ' per month, effective immediately. The $'+p.bonus+' promotion bonus arrives with your next payday, in '+p.days+'.',
    'nudge.subject':'How is the ramp-up going?',
    'nudge.body':p=>'I noticed “'+p.title+'” took a few attempts. If it gets hard again — check the table schema and the hint in QueryBench, or write to me in PulseChat.',
    'praise.subject':'Nice work 👏',
    'praise.body':p=>'I saw your query on “'+p.title+'” — clean and to the point. Keep it up.',
    'rest.chat':'You have pulled a lot today — there is almost no energy left. End the shift from the Menu, the tasks will wait until tomorrow.',
    'director.subject':'How are things generally?',
    'director.body':'Just wanted to say the team is glad to have you. If you ever need help with SQL, ask Sarah.',
    'style.intro':p=>'I looked at your query for “'+p.title+'” — the numbers are right, accepted. One note for next time: '+p.note,

    'mail.pick':'Pick an email on the left.',
    'mail.from':p=>'From: '+p.name+' · '+p.role,
    'chat.reply.take':'On it, will send shortly.',
    'chat.reply.clarify':'Could you give me a bit more — where should I start?',
    'chat.reply.hi':'Hi! How are things?',
    'chat.reply.thanks':'Thanks!',
    'chat.reply.offer':'If you need anything counted, just write — I will sort it out.',
    'chat.hintReply':p=>'Sure. Here: '+p.hint,

    'files.title':n=>'🗂️ Reports ('+n+')',
    'files.empty':'No reports yet. They appear here automatically when you submit a task.',
    'files.nothingFound':'Nothing found.',
    'files.search':'Search by task or query',
    'files.pick':'Pick a report on the left.',
    'files.meta':p=>'Day '+p.day+' · '+p.rows+' rows · '+p.cols+' columns',
    'files.download':'⬇ Download CSV',
    'files.copySql':'📋 Copy SQL',
    'files.exportAll':'⬇ Export the list',
    'files.truncated':'The report keeps the first 20 rows of the result — the CSV gets the same 20.',
    'files.exported':p=>'A list of '+p.n+' reports exported.',
    'files.oneExported':'Report exported to CSV.',
    'files.sqlCopied':'SQL copied to the clipboard.',
    'files.sqlCopyFail':'⚠ The browser denied clipboard access — copy the query by hand.',
    'files.allSuffix':'_reports.csv',
    'files.dayPrefix':'day',
    'files.colDay':'day', 'files.colTask':'task', 'files.colRows':'rows', 'files.colSql':'sql',
    'files.downloadFail':p=>'⚠ Could not download the file: '+p.msg,

    'prof.employee':'Employee',
    'prof.career':'Career',
    'prof.money':'Money',
    'prof.mastery':'Topic mastery',
    'prof.masteryNote':'Based on the average number of attempts. Topics that give you trouble come back into rotation more often.',
    'prof.repLine':p=>'Reputation '+p.rep+' · '+p.line,
    'prof.toNext':p=>p.rep+' reputation to “'+p.level+'”',
    'prof.maxLevel':'Top position reached',
    'prof.days':n=>pluralEn(n,'day','days')+' at the company',
    'prof.solved':n=>pluralEn(n,'task submitted','tasks submitted'),
    'prof.reports':n=>pluralEn(n,'report','reports')+' in FileDock',
    'prof.attemptsPer':'attempts per task',
    'prof.hints':n=>pluralEn(n,'hint bought','hints bought'),
    'prof.paydays':n=>pluralEn(n,'payday received','paydays received'),
    'prof.inAccount':'in the account',
    'prof.basePay':'base pay',
    'prof.bonusPending':'bonus pending',
    'prof.paydayIn':'payday in',
    'prof.notTried':'not attempted',
    'prof.solid':'solid',
    'prof.ok':'okay',
    'prof.revisit':'worth revisiting',
    'prof.attemptsShort':n=>n+' att.',

    'diag.empty':'The query ran but returned no rows at all — the filter is cutting off everything. Check the values and the range bounds.',
    'diag.scalarMany':n=>'One final number was needed, and '+n+' rows came back. Looks like an aggregate function is missing — right now the query returns individual rows rather than a summary.',
    'diag.scalarNotNumber':'There is no number anywhere in the result, and the answer has to be a numeric value.',
    'diag.scalarOff':'One row is right, but the number does not match. Check which column you are aggregating and whether extra rows are creeping into the calculation.',
    'diag.countOff':'The shape is right but the number is not — the filter is catching the wrong rows.',
    'diag.countRows':n=>'The count does not match: right now the result has '+n+' rows. Check the filter, it is most likely catching too much or cutting off what you need.',
    'diag.groupsNone':'One row came back instead of a breakdown — looks like there is no GROUP BY, so the aggregate was computed over the whole table at once.',
    'diag.groupsCount':n=>'You got '+n+' groups — that is not the number there should be. Check which column you are grouping by and whether the filter is cutting off too much.',
    'diag.groupsNoNumber':'The groups are there, but the result has no numeric column — an aggregate function is missing.',
    'diag.groupsValues':'The groups themselves are right, but the numbers inside them are not. Check which column you are aggregating and with which function.',
    'diag.keysCount':n=>'The answer has '+n+' rows — the correct filter produces a different count. Check the operator and the bounds.',
    'diag.keysValues':'The number of rows is right, but the set of values is different — the condition is catching the wrong rows.',
    'diag.bestMany':n=>n+' rows came back, and only one best result is needed. Add sorting by the relevant value and LIMIT 1.',
    'diag.bestOff':'One row, but the wrong one. Check the sort direction (DESC or ASC) and the formula itself.',
    'diag.generic':'Not quite. Check the filter, the grouping and the aggregate function.',

    'style.star':'you dumped the whole table with SELECT *. Better not to in a real report: list the columns explicitly — then the result does not shift when a field is added to the table, and a colleague can see at a glance what you counted.',
    'style.alias':'an aggregate without an alias produces a column with a machine name like sum_amount. Add AS with a readable name — reports get read by people, not only by you.',
    'style.orchain':'several ORs on the same column are shorter and safer written as IN (...) — fewer chances to get the brackets wrong once there are five values.',
    'style.limitnoorder':'LIMIT without ORDER BY returns arbitrary rows — one set today, another tomorrow. If you want a “top N”, the sort has to be stated explicitly.',

    'storage.label.cloud':'☁️ cloud (Claude)',
    'storage.label.local':'💻 this browser',
    'storage.label.memory':'⚠️ session only',
    'storage.note.cloud':'Progress is saved to the Claude cloud — available from any device on this account.',
    'storage.note.local':'Progress is saved in this browser on this device (localStorage). In private mode, or after clearing browser data, saves will be lost.',
    'storage.note.memory':'⚠ Storage is unavailable in this environment — progress will not survive a page reload.',
    'save.emptyResult':'storage.set returned an empty result',
    'save.notFound':'record not found',
    'save.failed':p=>'⚠ Could not save: '+p.msg,
    'save.loadFailed':p=>'⚠ Could not load the career: '+p.msg,
    'save.corrupt':p=>'⚠ The save is corrupted: '+p.msg,
    'save.deleteFailed':p=>'⚠ Could not delete: '+p.msg,
    'open.qb':'Open in QueryBench →',
    'open.task':'Open the task →',
    'open.chart':'Open in ChartLab →',
    'load.loading':'Loading…',
    'load.none':'No saved careers yet.',
    'load.day':n=>'Day '+n,
    'load.play':'Play',
    'load.delete':'Delete',
    'load.confirmDelete':'Delete permanently?',
    'load.yes':'Yes',
    'load.cancel':'Cancel',
    'login.defaultName':'Intern',
    'login.pickProfession':'Pick a profession.',
    'login.startHint':'👋 Start with PulseChat — Sarah is already writing to you.',
    'login.welcomeBack':p=>'Welcome back, '+p.name+'!',

    'dash.title':'Employee profile',
    'dash.reputation':'Reputation',
    'dash.energy':'Energy',
    'dash.balance':'Balance',
    'dash.salary':'Base pay',
    'dash.bonus':'Bonus pending',
    'dash.payday':'Payday in',
    'dash.day':'Day',
    'dash.storage':'Saves',
    'dash.openProfile':'Open profile →',
    'dash.perMonth':'/ mo',
    'dash.today':'today',

    'app.ref':'SQL reference',
    'app.profile':'Profile',
    'badge.exam':'EXAM',

    'task.from':p=>'Task from '+p.name+' ('+p.role+')',
    'task.open':n=>'📋 In progress ('+n+')',
    'task.done':n=>'✓ Completed ('+n+')',
    'task.noneOpen':'No active tasks. Wait for a message from a colleague — or check PulseChat and InboxPro.',
    'task.noneDone':'Nothing yet.',
    'task.pick':'Pick a task on the left.',
    'task.meta':p=>'From: '+p.from+' · '+p.role+'<br>Channel: '+p.channel+' · Attempts: '+p.attempts,
    'task.reward':p=>'Reward: +'+p.rep+' rep, +$'+p.money+' · Energy cost: '+p.energy+'%',
    'task.completed':'✓ Task completed',
    'task.statusDone':'done',
    'task.statusOpen':'in progress',
    'task.noEnergy':p=>'Not enough energy ('+p.have+'% of '+p.need+'%). End the shift from the Menu.',

    'qb.schema':'Schema',
    'qb.samples':'samples:',
    'qb.rowCount':n=>'rows: '+n,
    'qb.run':'▶ Run',
    'qb.submit':'✓ Submit answer',
    'qb.csv':'⬇ CSV',
    'qb.accepted':'✓ Answer accepted',
    'qb.shortcutsTask':'Ctrl+Enter — run · Ctrl+S — submit',
    'qb.shortcutsSandbox':'Ctrl+Enter — run',
    'qb.doneNote':'Task submitted — feel free to keep polishing the query',
    'qb.emptyResult':'The query ran, but returned nothing.',
    'qb.sandboxTitle':'🧪 Sandbox · DataCo database',
    'qb.sandboxNote':'No active task — this is a working copy of the company database. Write any query you like, nothing here can break: the data goes nowhere and does not affect your progress. Tasks open from PulseChat, InboxPro or TaskBoard.',
    'qb.csvDone':'Query result exported to CSV.',
    'csv.sandboxFile':'sandbox',
    'csv.resultSuffix':'_result.csv',
    'hint.l1':'💡 Nudge',
    'hint.l2':'🧩 Query skeleton',
    'hint.l3':'📝 Full query',
    'hint.free':'free',
    'hint.bought':p=>'Hint purchased: −$'+p.price,
    'hint.tooPoor':'Not enough money for a hint.',
    'hint.noMoney':p=>'Not enough money: $'+p.money+' in the account. Payday in '+p.days+'.',
    'hint.missing':'No hint has been written for this task yet.',
    'hint.examCosts':'This is an exam — hints cost double here.',
    'energy.blocked':p=>'🪫 Energy is down to '+p.have+'% and this task needs '+p.need+'%. You can still work on it, but you will not be able to submit — end the shift via <b>Menu → End the shift</b>.',
    'energy.low':p=>'🔋 Running low on energy: '+p.have+'%. This task will cost '+p.need+'%.',
    'energy.cantSubmit':p=>'🪫 Not enough energy ('+p.have+'% of '+p.need+'%). End the shift from the Menu — your draft is kept.',

    'choice.multi':'more than one may apply',
    'choice.hintMulti':'Tick every option that applies, then submit',
    'choice.hintSingle':'Pick an option and submit',
    'choice.doneNote':'Submitted — every option is explained below',
    'choice.notThis':'That option does not apply.',
    'choice.missing':n=>'Everything you ticked is right, but not everything is ticked: '+n+' more '+pluralEn(n,'option','options')+' to find. Re-read the rest.',

    'chart.kind':'Chart type',
    'chart.x':'Horizontal axis',
    'chart.y':'Vertical axis',
    'chart.data':'Data',
    'chart.line':'📈 Line',   'chart.lineHint':'how it changed',
    'chart.bar':'📊 Bars',    'chart.barHint':'which is bigger',
    'chart.pie':'🥧 Pie',     'chart.pieHint':'share of the whole',
    'chart.preview':'Pick a chart type and both axes — the preview appears here.',
    'chart.hintBuild':'Build the chart and submit',
    'chart.doneNote':'Submitted',
    'chart.emptyTitle':'No active ChartLab task.',
    'chart.emptySub':'Chart tasks arrive from colleagues in PulseChat and InboxPro — open one from there or from TaskBoard.',
    'chart.wrongKind':'This chart type does not answer the question asked.',
    'chart.wrongX':p=>'Chart type is right. But the horizontal axis should carry what you are comparing along — right now it holds “'+p.x+'”.',
    'chart.wrongY':p=>'Chart type and horizontal axis are right. Now pick the quantity they actually asked for: “'+p.y+'” is not it.',

    'judg.clarifyQuestion':'The request is vague. Which question should you ask first, before you start counting?',
    'judg.clarifyReview':p=>'Right question on “'+p.title+'”. '+p.why,
    'judg.conclusionQuestion':'The numbers are already computed. Which conclusion actually follows from them?',
    'judg.conclusionReview':p=>'Right read on “'+p.title+'”. '+p.why,
    'judg.abQuestion':'What do you tell marketing?',
    'judg.abReview':p=>'You got “'+p.title+'” right. '+p.why,
    'judg.dqQuestion':'What in this extract will get in the way of counting?',
    'judg.dqReview':p=>'You found everything in “'+p.title+'”. The habit of looking at the data before writing the query saves more time than any optimisation: counting fast on dirty data just means getting a wrong number fast.',
    'judg.dashQuestion':'Which metrics go on the dashboard?',
    'judg.dashReview':p=>'You put “'+p.title+'” together correctly. The rule: a dashboard answers one specific question rather than showing everything you managed to compute. Every extra chart makes the necessary ones harder to see.',
    'chart.question':'Build the chart that answers the question.',
  },
};

// Пропущенный ключ не молчит и не падает: он виден в интерфейсе как ⟨ключ⟩, и его находит
// автоматическая проверка — обойти все экраны глазами на трёх десятках файлов нереально.
function tr(key, params){
  const pack=LOCALES[locale]||LOCALES.ru;
  let v=(key in pack)?pack[key]:LOCALES.ru[key];
  if(v===undefined) return '⟨'+key+'⟩';
  if(typeof v==='function') return v(params);
  if(params) v=String(v).replace(/\{(\w+)\}/g,(m,k)=> (k in params)?params[k]:m);
  return v;
}
// Разметка в index.html помечена data-i18n; так статические подписи не приходится
// перерисовывать вручную из десятка мест.
function applyStaticText(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent=tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder=tr(el.dataset.i18nPh); });
  // Заголовки окон и кнопки в панели задач живут вне шины перерисовки: они рисуются один
  // раз при открытии окна, поэтому при смене языка их надо обновить отдельно.
  document.querySelectorAll('[data-title-app]').forEach(el=>{ el.textContent=appTitle(el.dataset.titleApp); });
  document.querySelectorAll('.taskbar-app').forEach(el=>{
    el.textContent=APP_META[el.dataset.app].icon+' '+appTitle(el.dataset.app);
  });
  document.documentElement.lang=locale;
}
function setLocale(code){
  if(!LOCALES[code]) return;
  locale=code;
  try{ localStorage.setItem(LOCALE_KEY, code); }catch(e){}   // приватный режим — не беда
  applyContactLocale();
  applyStaticText();
  renderLangSwitch();
  if(career.slug) refresh();
}
function renderLangSwitch(){
  const box=$('lang-switch');
  if(!box) return;
  box.innerHTML=LOCALES_AVAILABLE.map(l=>
    `<button class="lang-btn${l.code===locale?' active':''}" data-lang="${l.code}">${esc(l.label)}</button>`
  ).join('')+`<span class="lang-note">${esc(tr('login.langNote'))}</span>`;
  box.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click', ()=>setLocale(b.dataset.lang)));
}
function initLocale(){
  let saved=null;
  try{ saved=localStorage.getItem(LOCALE_KEY); }catch(e){}
  if(saved && LOCALES[saved]) locale=saved;
  applyContactLocale();
  applyStaticText();
  renderLangSwitch();
}
