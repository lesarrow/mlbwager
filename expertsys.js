/* This is where the brains of the applications resides. As the algorithm is refined, this file will
    be modified to reflect the new logic */


'use strict';

const GREAT_TEAMS = ["NYY", "MIN", "HOU", "LAD"];
const GOOD_TEAMS = ["TB", "BOS", "TEX", "OAK", "ATL", "PHI", "CHC", "MIL"];
const OK_TEAMS = ["CLE", "LAA", "WAS", "NYM", "SD", "STL", "COL"];
const BAD_TEAMS = ["TOR", "BAL", "CHW", "DET", "KC", "SEA", "MIA", "CIN", "PIT", "ARI", "SF"];


/* rankTheMatchup - given a visitor and a home team, the function returns a value of who is more likely to win */

function rankTheMatchup(visitor, home) {

    let visitorValue = 0;
   
    if (GREAT_TEAMS.indexOf(visitor) > -1)
        visitorValue = 3;
    else if (GOOD_TEAMS.indexOf(visitor) > -1)
        visitorValue = 2;
    else if (OK_TEAMS.indexOf(visitor) > -1)
        visitorValue = 1;

    let homeValue = 0;

    if (GREAT_TEAMS.indexOf(home) > -1)
        homeValue = 3;
    else if (GOOD_TEAMS.indexOf(home) > -1)
        homeValue = 2;
    else if (OK_TEAMS.indexOf(home) > -1)
        homeValue = 1;
 
    return visitorValue - homeValue;
}