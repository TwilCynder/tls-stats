import {readEventLists} from "./sggap/include/lib/computeEventList.js";
import {GraphQLClient} from "graphql-request"
import {TimedQuerySemaphore} from "./sggap/include/lib/queryLimiter.js";
import {getEntrantsBasicForEvents} from "./sggap/include/getEntrantsBasic.js";

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} listFiles 
 * @param {TimedQuerySemaphore} limiter 
 */
async function fetchEntrantsForEventLists(client, listFiles, limiter){
    let events = await readEventLists([], listFiles
        .map(filename => "./tlsEvents/" + filename)
        .map(filename => filename.trim())
    );

    let data = await getEntrantsBasicForEvents(client, events, limiter, false);
    return data;
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} ultLists 
 * @param {string[]} meleeLists 
 * @param {TimedQuerySemaphore} limiter 
 */
export async function fetchPeriodEntrants(client, ultLists, meleeLists, limiter){
    let [ult, melee] = await Promise.all([
        fetchEntrantsForEventLists(client, ultLists, limiter),
        fetchEntrantsForEventLists(client, meleeLists, limiter)
    ]);

    return {ult, melee};
}