import {fetchPeriodEntrants} from "./fetch.js";
import { getEntrantsBasicForEvents } from "./sggap/include/getEntrantsBasic.js";
import {client} from "./sggap/include/lib/client.js"
import { readEventLists } from "./sggap/include/lib/computeEventList.js";
import { StartGGDelayQueryLimiter } from "./sggap/include/lib/queryLimiter.js";
import { processUniqueEntrantsLeague } from "./sggap/include/uniqueEntrantsUtil.js";
import fs from 'fs'

const ULT_OLD=[
    "seasons/legacy/events.txt", 
    "seasons/2023.2/eventsTLS.txt",
    "seasons-unranked/legacy/unrankedEvents.txt"
];
const MELEE_OLD=["/seasons/legacy/meleeEvents.txt"]
const starting_year = 2024; 

/**
 * 
 * @param {typeof entrants[0]} periodData 
 */
function processPeriod(periodData){
    let countUlt = 0;
    let entrantsUlt = [];
    let countMelee = 0;
    let entrantsMelee = [];

    entrantsUlt = processUniqueEntrantsLeague(periodData.ult);
    for (let event of periodData.ult){
        if (!event || !event.entrants) continue;
        countUlt += event.entrants.length;
    }

    entrantsMelee = processUniqueEntrantsLeague(periodData.melee.concat(periodData.ult));
    for (let event of periodData.melee){
        if (!event || !event.entrants) continue;
        countMelee += event.entrants.length;
    }

    return {
        periodName: periodData.periodName, 
        countUlt, countMelee, 
        uniqueUlt: entrantsUlt.length, 
        uniqueMelee: entrantsMelee.length
    }
}

let limiter = new StartGGDelayQueryLimiter;

/**
 * 
 * @param {string} periodName 
 * @param {string[]} ultFiles 
 * @param {string[]} meleeFiles 
 * @returns 
 */
async function readPeriodEvents(periodName, ultFiles, meleeFiles){
    console.log("============ Reading events for period", periodName, "============");
    let [ult, melee] = await Promise.all([
        readEventLists([], ultFiles.map(filename => "tlsEvents/" + filename.trim()), true),
        readEventLists([], meleeFiles.map(filename => "tlsEvents/" + filename.trim()), true)
    ]);

    console.log("-------- Ultimate --------");
    for (let event of ult){
        console.log(event);
    }
    console.log("-------- Melee --------");
    for (let event of melee){
        console.log(event);
    }

    return {periodName, ult, melee};
}

let events = [await readPeriodEvents("2019 - 2023", ULT_OLD, MELEE_OLD)];
let year = starting_year;

while (true){
    if (!fs.existsSync(`./tlsEvents/seasons/${year}.1`)) break;

    events.push(await readPeriodEvents(""+year, [
        `seasons/${year}.1/eventsTLS.txt`,
        `seasons/${year}.2/eventsTLS.txt`,
        `seasons-unranked/${year}/unrankedEvents.txt`,
    ], [
        `seasons/ssbm.${year}/eventsTLS.txt`,
        `seasons-unranked/${year}/rivalsEvents.txt`,
    ]));

    year++;
}

let entrants = await Promise.all(events.map(period =>(async ()=>{

    let [ult, melee] = await Promise.all([
        getEntrantsBasicForEvents(client, period.ult, limiter),
        getEntrantsBasicForEvents(client, period.melee, limiter)
    ]);

    return {periodName: period.periodName, ult, melee};
})()))

let periods = entrants.map(period => processPeriod(period));

let totalCount = periods.reduce((prev, current) => prev + current.countUlt + current.countMelee, 0);
let totalUnique = processUniqueEntrantsLeague(entrants.reduce((prev, curr) => prev.concat(curr.melee).concat(curr.ult), [])).length;

limiter.stop();

console.log(totalCount);
console.log(totalUnique);

fs.writeFileSync("_site/data.json", JSON.stringify({totalCount, totalUnique, periods}, null));