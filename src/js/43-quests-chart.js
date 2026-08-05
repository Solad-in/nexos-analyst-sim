"use strict";
/* ============ chart tasks (type: chart) ============ */
// Выбор типа графика — часто вопрос вкуса, и задача, где верный ответ угадывается, была бы
// вредной. Поэтому сценарии подобраны так, что неверные варианты неверны по существу,
// а формулировка вопроса прямо называет, что нужно увидеть:
//   • тренд по двенадцати месяцам — линия (двенадцать столбцов тренд прячут, круг абсурден);
//   • сравнение независимых категорий — столбцы (линия утверждает несуществующий переход);
//   • структура целого — круг (столбцы не показывают долю от целого).
// Вторая половина задачи — оси: в данных всегда есть лишняя числовая колонка, и выбрать
// надо ту величину, о которой спрашивают.
const CHART_TEXT={
  ru:{
    trend:{
      title:'График выручки за год',
      prompt:'Готовлю годовой отчёт. Нужен график, по которому сразу видно, как выручка менялась от месяца к месяцу и есть ли рост. Расходы в этих же данных — они для другого слайда, сюда не нужны.',
      columns:['месяц','выручка','расходы'],
      months:['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'],
      whyKind:{
        bar:'Столбцы сравнивают величины между собой, а не показывают движение. Двенадцать столбцов подряд читаются как частокол: увидеть в них тренд глаз не может, а спрашивают именно про него.',
        pie:'Круг показывает доли одного целого. Месяцы не части чего-то общего, и сумма выручки за год в виде процентов по месяцам не отвечает ни на какой вопрос.',
      },
      reviewNote:'График по выручке ты собрал правильно. Линия — единственный из трёх типов, который говорит «между этими точками есть движение», поэтому время рисуют ей. Столбцы отвечают на вопрос «что больше», а не «куда идёт».',
    },
    compare:{
      title:'Сравнение каналов по заявкам',
      prompt:'Собираемся резать бюджет и надо показать на встрече, какой канал приносит больше всего заявок, а какой меньше. Стоимость заявки в этих данных тоже есть, но сейчас разговор не про неё.',
      columns:['канал','заявки','стоимость заявки'],
      whyKind:{
        line:'Линия соединяет соседние точки и тем самым утверждает, что между ними есть промежуточные состояния. Между двумя разными каналами ничего нет — это независимые категории, и порядок их на оси вообще произволен.',
        pie:'Круг ответил бы на вопрос «какую долю даёт каждый канал», а спрашивают, какой больше. Сравнивать величины углов на глаз человек умеет плохо, длины столбцов — хорошо.',
      },
      reviewNote:'Верно: независимые категории сравнивают столбцами. И заметь, почему не круг — вопрос был «какой больше», а не «какая доля». Тип графика выбирается под вопрос, а не под данные.',
    },
    share:{
      title:'Из чего складывается выручка',
      prompt:'Совет директоров спрашивает про структуру выручки: какую часть общего оборота даёт каждый из трёх источников. Нужен один график, по которому это видно с первого взгляда.',
      columns:['источник','выручка','сделок'],
      sources:['Прямые продажи','Партнёрская сеть','Онлайн-магазин'],
      whyKind:{
        bar:'Столбцы показывают, какой источник больше, но не какую часть целого он занимает: чтобы понять долю, придётся складывать столбцы в уме. Спрашивают именно про долю.',
        line:'Линия предполагает движение вдоль оси. Три источника не следуют друг за другом ни во времени, ни в чём-либо ещё — соединять их линией нечем.',
      },
      reviewNote:'Верно. Круг — единственный тип, который сразу отвечает «какая часть от целого», и годится он только когда части действительно складываются в осмысленное целое и их немного. На двенадцати сегментах он превращается в кашу.',
    },
  },
  en:{
    trend:{
      title:'Revenue chart for the year',
      prompt:'I am putting together the annual report. I need a chart that immediately shows how revenue moved month to month and whether there is growth. Costs are in the same data — those are for another slide, not needed here.',
      columns:['month','revenue','costs'],
      months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      whyKind:{
        bar:'Bars compare quantities against each other, they do not show movement. Twelve bars in a row read as a picket fence: the eye cannot pick a trend out of them, and a trend is exactly what was asked for.',
        pie:'A pie shows parts of one whole. Months are not parts of anything, and a year of revenue expressed as monthly percentages answers no question at all.',
      },
      reviewNote:'You built the revenue chart correctly. A line is the only one of the three types that says “there is movement between these points”, which is why time is drawn with it. Bars answer “which is bigger”, not “where is this heading”.',
    },
    compare:{
      title:'Comparing channels by signups',
      prompt:'We are about to cut budget and I need to show at the meeting which channel brings the most signups and which the fewest. Cost per signup is in the data too, but that is not the conversation right now.',
      columns:['channel','signups','cost per signup'],
      whyKind:{
        line:'A line connects neighbouring points and thereby claims there are intermediate states between them. Between two different channels there is nothing — they are independent categories, and their order on the axis is arbitrary anyway.',
        pie:'A pie would answer “what share does each channel bring”, but the question is which one is bigger. People judge angles poorly and bar lengths well.',
      },
      reviewNote:'Right: independent categories are compared with bars. And note why not a pie — the question was “which is bigger”, not “what share”. The chart type follows the question, not the data.',
    },
    share:{
      title:'What revenue is made of',
      prompt:'The board is asking about revenue structure: what portion of total turnover each of the three sources brings. One chart that shows it at a glance.',
      columns:['source','revenue','deals'],
      sources:['Direct sales','Partner network','Online store'],
      whyKind:{
        bar:'Bars show which source is bigger, but not what portion of the whole it takes: to work out the share you would have to add the bars up in your head. The question is precisely about the share.',
        line:'A line implies movement along the axis. The three sources do not follow one another in time or in anything else — there is nothing to connect.',
      },
      reviewNote:'Correct. A pie is the only type that answers “what part of the whole” straight away, and it only works when the parts genuinely add up to a meaningful whole and there are few of them. At twelve segments it turns to mush.',
    },
  },
};
function chartText(){ return CHART_TEXT[locale]||CHART_TEXT.ru; }

function chartTrend(){
  const T=chartText().trend, C=T.columns;
  let revenue=randInt(800,1100), costs=randInt(300,500);
  const rows=T.months.map(m=>{
    revenue+=randInt(-60,180); costs+=randInt(-20,60);
    return {[C[0]]:m, [C[1]]:Math.max(200,revenue), [C[2]]:Math.max(100,costs)};
  });
  return {title:T.title, prompt:T.prompt, data:{columns:C, rows},
          correct:{kind:'line', x:C[0], y:C[1]}, whyKind:T.whyKind, reviewNote:T.reviewNote};
}
function chartCompare(){
  const T=chartText().compare, C=T.columns;
  const rows=shuffle(vocab('channels')).slice(0,4).map(ch=>({
    [C[0]]:ch, [C[1]]:randInt(40,320), [C[2]]:randInt(150,900),
  }));
  return {title:T.title, prompt:T.prompt, data:{columns:C, rows},
          correct:{kind:'bar', x:C[0], y:C[1]}, whyKind:T.whyKind, reviewNote:T.reviewNote};
}
function chartShare(){
  const T=chartText().share, C=T.columns;
  const rows=T.sources.map(s=>({[C[0]]:s, [C[1]]:randInt(1200,6000), [C[2]]:randInt(20,180)}));
  return {title:T.title, prompt:T.prompt, data:{columns:C, rows},
          correct:{kind:'pie', x:C[0], y:C[1]}, whyKind:T.whyKind, reviewNote:T.reviewNote};
}

const CHART_CASES=[chartTrend, chartCompare, chartShare];
function genChartTask(){
  const c=pick(CHART_CASES)();
  return {
    type:'chart', key:'chart', title:c.title,
    prompt:c.prompt,
    question:tr('chart.question'),
    data:c.data, correct:c.correct, whyKind:c.whyKind,
    reviewNote:c.reviewNote,
    rewardRep:12, rewardMoney:95, energyCost:10,
  };
}

// Графики просят и в переписке, и письмом — кладём в оба пула.
CHAT_GENS.push(genChartTask);
MAIL_GENS.push(genChartTask);
GEN_KEY.set(genChartTask,'chart');
