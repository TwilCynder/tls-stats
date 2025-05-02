let data = await fetch("./data.json").then(res => res.json());

document.getElementById("total-count").innerHTML = "" + data.totalCount;
document.getElementById("total-unique").innerHTML = "" + data.totalUnique;

let html = ""
for (let period of data.periods){
    html += `
        <tr>
        <td class = "year">${period.periodName}</td>
        <td class = "stat">${period.countMelee + period.countUlt}</td>
        <td class = "stat">${period.uniqueMelee}</td>
        </tr>
    `
}
document.getElementById("table-body").innerHTML = html;

console.log(data);