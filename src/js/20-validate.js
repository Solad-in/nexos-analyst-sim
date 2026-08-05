"use strict";
function validateBySpec(spec, resultRows){
  if(!resultRows || !resultRows.length) return false;
  switch(spec.kind){
    case 'count': {
      if(resultRows.length===1){
        const vals=Object.values(resultRows[0]);
        const allNumeric=vals.every(v=>typeof v==='number');
        if(allNumeric && vals.some(v=>v===spec.expectedCount)) return true;
      }
      if(resultRows.length===spec.expectedCount && spec.expectedCount>0){
        return resultRows.every(r=>{
          if(spec.column && !(spec.column in r)) return true;
          return spec.column ? r[spec.column]===spec.target : true;
        });
      }
      return false;
    }
    case 'scalar':
      if(resultRows.length!==1) return false;
      return Object.values(resultRows[0]).some(v=>typeof v==='number'&&Math.abs(v-spec.expected)<=spec.tolerance);
    case 'groups':
      if(resultRows.length!==spec.groups.length) return false;
      return spec.groups.every(exp=>resultRows.some(row=>{
        // counts need an exact match; money sums keep the old relative slack
        const tol=(spec.tolerance!==undefined)?spec.tolerance:Math.max(1,exp.value*0.02);
        const vals=Object.values(row);
        const hasKey=vals.some(v=>typeof v==='string'&&v.toLowerCase()===exp.key.toLowerCase());
        const hasVal=vals.some(v=>typeof v==='number'&&Math.abs(v-exp.value)<=tol);
        return hasKey&&hasVal;
      }));
    // Exactly this set of values must appear in the result, order-independent — used when the
    // answer is "which rows", not "how many". Kept declarative so quests stay JSON-serializable.
    case 'keySet': {
      if(resultRows.length!==spec.keys.length) return false;
      const seen=[];
      resultRows.forEach(row=>Object.values(row).forEach(v=>{ if(v!==null&&v!==undefined) seen.push(String(v).toLowerCase()); }));
      return spec.keys.every(k=>{
        const i=seen.indexOf(String(k).toLowerCase());
        if(i<0) return false;
        seen.splice(i,1);
        return true;
      });
    }
    case 'bestMatch':
      return resultRows.some(row=>{
        const vals=Object.values(row);
        const hasKey=vals.some(v=>typeof v==='string'&&spec.keys.includes(v.toLowerCase()));
        const hasVal=vals.some(v=>typeof v==='number'&&(
          Math.abs(v-spec.value)<=spec.tolerance ||
          (spec.altValue!==undefined && Math.abs(v-spec.altValue)<=(spec.altTolerance!==undefined?spec.altTolerance:spec.tolerance))
        ));
        return hasKey&&hasVal;
      });
    default: return false;
  }
}

