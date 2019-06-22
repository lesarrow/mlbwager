'use strict';

// base64 encoded API key required for MYSPORTSFEED
const MYSPORTSFEEDSAPI_KEY = "Basic OGY2NDhhMzAtYmMxMy00ODU2LTkyM2ItNzU3ZmIxOk1ZU1BPUlRTRkVFRFM=";

// Create the static headers for the mysportsfeeds api

const MYSPORTSFEEDS_HEADERS = new Headers();
MYSPORTSFEEDS_HEADERS.append("Authorization", MYSPORTSFEEDSAPI_KEY);

// The prefix get request for mysportfeeds to retrieve the daily schedule

const MYSPORTSFEEDS_SCHEDULE = "https://api.mysportsfeeds.com/v2.1/pull/mlb/current/date/";
const MYSPORTSFEEDS_ODDS = "https://api.mysportsfeeds.com/v2.1/pull/mlb/current/date/"

const NEWSAPI_CALL = "https://newsapi.org/v2/everything?apiKey=758ddae94aa246708e4cb23dd2754da1";

const TEAMKEY = {
    NYY: "New York Yankees",
    TB: "Tampa Bay Rays",
    BOS: "Boston Red Sox",
    TOR: "Toronto Blue Jays",
    BAL: "Baltimore Orioles",
    MIN: "Minnesota Twins",
    CLE: "Cleveland Indians",
    CWS: "Chicago White Sox",
    DET: "Detroit Tigers",
    KC:  "Kansas City Royals",
    HOU: "Houston Astros",
    TEX: "Texas Rangers",
    OAK: "Oakland Athletics",
    LAA: "Los Angeles Angels",
    SEA: "Seattle Mariners",
    ATL: "Atlanta Braves",
    PHI: "Philadelphia Phillies",
    WAS: "Washington Nationals",
    NYM: "New York Mets",
    MIA: "Miami Marlins",
    CHC: "Chicago Cubs",
    MIL: "Milwaukee Brewers",
    STL: "St. Louis Cardinals",
    CIN: "Cincinnati Reds",
    PIT: "Pittsburgh Pirates",
    LAD: "Los Angeles Dodgers",
    COL: "Colorado Rockies",
    SD:  "San Diego Padres",
    ARI: "Arizona Diamondbacks",
    SF:  "San Francisco Giants"
};

/* class Game - 
    visitor, home - the abbreviation of the competing teams
    gameid - used in future api calls to identify a game
    rank - the value of this game in terms of whether or not to make a bet
*/

class Game {

    constructor() {

        this.visitor = undefined;
        this.home = undefined;
        this.visitorOdds = 0;
        this.homeOdds = 0;
        this.gameid = 0;
        this.rank = 0;       
    }

    getVisitor() {
        return this.visitor;
    }

    getFullVisitor() {
        return TEAMKEY[this.visitor];
    }

    setVisitor(team) {
        this.visitor = team;
    }

    getHome() {
        return this.home;
    }

    getFullHome() {
        return TEAMKEY[this.home];
    }

    setHome(team) {
        this.home = team;
    }

    getGameId() {
        return this.gameid;
    }

    setGameId(value) {
        this.gameid = value;
    }

    oddsToString(value) {
        if (value < 0)
            return "(" + value + ")";
        
        if (value > 0)
            return "(+" + value + ")";

        return "";
    }

    setVisitorOdds(value) {
        this.visitorOdds = value;
    }

    getVisitorOdds() {
        return this.visitorOdds;
    }

    getVisitorOddsStr() {
        return this.oddsToString(this.visitorOdds);
    }

    setHomeOdds(value) {
        this.homeOdds = value;
    }

    getHomeOdds() {
        return this.homeOdds;
    }

    getHomeOddsStr() {
        return this.oddsToString(this.homeOdds);
    }

    getRank() {
        return this.rank;
    }

    setRank(value) {
        this.rank = value;
    }

    printToConsole() {
        console.log(`${this.visitor} ${this.visitorOdds} @ ${this.home} ${this.homeOdds} ID: ${this.gameid}`);
    }

}



/* formatDateForMySportsFeeds -
    date : string in mm/dd/yyyy format
    returns: string in yyyymmdd format
*/

function formatDateForMySportsFeeds(inputDate) {

    let x = inputDate.split("-");
    return x[0] + x[1] + x[2];
}


function buildListOfGames(responseJson) {

    let gameList = [];

    /* Iterate through the games list. Only insert games with unplayed status into the array */

    let game;
    for (let i=0; i<responseJson.games.length; i++) {
        if (responseJson.games[i].schedule.playedStatus != "UNPLAYED")
            continue;
        
        game = new Game();
        game.setGameId(responseJson.games[i].schedule.id);
        game.setVisitor(responseJson.games[i].schedule.awayTeam.abbreviation);
        game.setHome(responseJson.games[i].schedule.homeTeam.abbreviation);
        gameList.push(game);
    }

    return gameList;
}


/* function rankTheGames - sets the rank value for each game in the input array
    gameSchedule - array of game objects */

function rankTheGames(gameSchedule) {

    for (let i=0; i<gameSchedule.length; i++) {
        gameSchedule[i].setRank(rankTheMatchup(gameSchedule[i].getVisitor(), gameSchedule[i].getHome()));
    }
}


/* addTheGameOdds - adds the odds information from oddsJson into the array of games 
    gameSchedule - array of Game objects
    oddsJson - JSON formatted data of odds information per game
*/

function addTheGameOdds(gameSchedule, oddsJson) {

    /* Optimization - Often if odds for one game is missing, they haven't been released for
        any of the games, so rather than do a long search and match for odds and games in the 
        game schedule, we do a quick exit if all odds are empty. */

    let quickExit = true;
    for (let i=0; i<oddsJson.gameLines.length; i++) {        
        if (oddsJson.gameLines[i].lines.length != 0) {
            quickExit = false;
            break;
        }
    }

    if (quickExit) {
        console.log("Quick exiting addTheGameOdds");
        return;
    }

    /* Enter the game odds for each game */
    for (let i=0; i<gameSchedule.length; i++) 
        for (let j=0; j<oddsJson.gameLines.length; j++) {

            /* find the matching game */
            if (gameSchedule[i].getGameId() != oddsJson.gameLines[j].game.id)
                continue;
            
            /* make sure the lines are not empty */

//            console.log(oddsJson.gameLines[j].game.id);
            if (oddsJson.gameLines[j].lines.length === 0)
                continue;
            

            //for readability only
            let moneyLines = oddsJson.gameLines[j].lines[0].moneyLines;

            gameSchedule[i].setVisitorOdds(moneyLines[moneyLines.length - 1].moneyLine.awayLine.american);
            gameSchedule[i].setHomeOdds(moneyLines[moneyLines.length - 1].moneyLine.homeLine.american);

            /* We only look for one match so we can break out */
            break;
        }       
}


function displayTheStrikeouts(gameSchedule) {

    $('.strikeouts').empty();
    $('.strikeouts').append("<h3>Strikeouts - Games to Avoid</h3>");
    $('.strikeouts').append("<ul>");

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        if (gameSchedule[i].getRank() == 0) {
            gamesFound = true;
            $('.strikeouts').append(`<li>${gameSchedule[i].getVisitor()} ${gameSchedule[i].getVisitorOddsStr()} @ ` +
                `${gameSchedule[i].getHome()} ${gameSchedule[i].getHomeOddsStr()}</li>`);
            $('.strikeouts').append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
    }

    if (!gamesFound) {
        $('.strikeouts').append("<li>None</li>");
    }

    $('.strikeouts').append("</ul>");

}


function displayTheBunts(gameSchedule) {

    $('.bunts').empty();
    $('.bunts').append("<h3>Bunts - Good Bets But Riskier</h3>");
    $('.bunts').append("<ul>");

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        let rank = gameSchedule[i].getRank();
        if (rank == 1) {
            gamesFound = true;
            $('.bunts').append(`<li>${gameSchedule[i].getVisitor()} ${gameSchedule[i].getVisitorOddsStr()} @ ` +
                `${gameSchedule[i].getHome()} ${gameSchedule[i].getHomeOddsStr()}</li>`);
            $('.bunts').append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        else if (rank == -1) {
            $('.bunts').append(`<li>${gameSchedule[i].getHome()} ${gameSchedule[i].getHomeOddsStr()} vs ` +
                `${gameSchedule[i].getVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</li>`);
            $('.bunts').append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
    }

    if (!gamesFound) {
        $('.bunts').append("<li>None</li>");
    }

    $('.bunts').append("</ul>");


}

function displayTheGrandSlams(gameSchedule) {

    $('.grandSlams').empty();
    $('.grandSlams').append("<h3>Grand Slams - Best Bets</h3>");
    $('.grandSlams').append("<ul>");

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        let rank = gameSchedule[i].getRank();
        if (rank >= 2) {
            gamesFound = true;
            $('.grandSlams').append(`<li>${gameSchedule[i].getVisitor()} ${gameSchedule[i].getVisitorOddsStr()} @ ` +
                `${gameSchedule[i].getHome()} ${gameSchedule[i].getHomeOddsStr()}</li>`);
            $('.grandSlams').append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        else if (rank <= -2) {
            $('.grandSlams').append(`<li>${gameSchedule[i].getHome()} ${gameSchedule[i].getHomeOddsStr()} vs ` +
            `${gameSchedule[i].getVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</li>`);
            $('.grandSlams').append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
    }

    if (!gamesFound) {
        $('.grandSlams').append("<li>None</li>");
    }

    $('.grandSlams').append("</ul>");

}


function displayTheGames(gameSchedule) {

    $('.search-results-hdr').text(`Results for ${$('#search-date').val()}`);

    /* Display the Grand Slams */

    displayTheGrandSlams(gameSchedule);

    /* Display the Bunts */

    displayTheBunts(gameSchedule);

    /* Display the Strikeouts */

    displayTheStrikeouts(gameSchedule);

    $('.search-results').show();

    /* Scroll the document down to the results */

    document.getElementById("search-results").scrollIntoView();
}


/* responseInJson - created this function to reduce duplication of code and to have a single place to 
    make changes in case I decide to enhance this process */

function responseInJson(response) {

    if (response.ok)
        return response.json();
    else throw new Error(response.statusText);
   
}

function getAndDisplayTheHeadlines(gameSchedule) {

    /* fetch and show up to 4 articles related to the teams playing in each game */

    for (let i=0; i<gameSchedule.length; i++) {

        let todaysDate = new Date();
        let fetchstr = (`${NEWSAPI_CALL}&from=${todaysDate.getFullYear()}-${todaysDate.getMonth()+1}-${todaysDate.getDate()}` +
            `&q="${gameSchedule[i].getFullVisitor()}"AND"${gameSchedule[i].getFullHome()}"`);
//        console.log(fetchstr);
        fetch(fetchstr)
             .then(response => responseInJson(response))
             .then(responseJson => {
            
//                console.log(responseJson);
                const MAX_NUMBER_OF_ARTICLES = 4;

                let articlesToShow = MAX_NUMBER_OF_ARTICLES;

                if (responseJson.totalResults < MAX_NUMBER_OF_ARTICLES)
                    articlesToShow = responseJson.totalResults;

                /* Show links up to the MAX_NUMBER_OF_ARTICLES */

                let gameID = gameSchedule[i].getGameId();
                for (let j=0; j<articlesToShow; j++) 
                    $(`#${gameID}`).append(`<li><a href="${responseJson.articles[j].url}">${responseJson.articles[j].title}</a></li>`);
             })
             .catch(err => {
                console.log("An unexpected error occurred in getAndDisplayTheHeadlines: " + err.statusText);    
             });             
    }

}

function handleWebpage() {
  
    /* Get the date from the user and use that to search what games are available */

    $('form').submit(e => {

        e.preventDefault();

        /* The Mysportsfeeds API requires the date in a yyyymmdd format */

        let searchDate = formatDateForMySportsFeeds($('#search-date').val());

        /* Make an async call for the list of games for the date the user entered */
        
        fetch (MYSPORTSFEEDS_SCHEDULE + searchDate + "/games.json?status=unplayed", {headers: MYSPORTSFEEDS_HEADERS})
            .then(response => responseInJson(response))
            .then(responseJson => {

                /* The response came back ok, so take the data returned and create an array of
                    objects reflecting the matchups */

                return buildListOfGames(responseJson);                
            })
            .then (gameSchedule => {

                /* Make another async call this time for the odds for the games */

                fetch(MYSPORTSFEEDS_ODDS + searchDate + "/odds_gamelines.json", {headers: MYSPORTSFEEDS_HEADERS})
                    .then(response => responseInJson(response))
                    .then (responseJson => {
                        addTheGameOdds(gameSchedule, responseJson);
                        rankTheGames(gameSchedule);
                        displayTheGames(gameSchedule);
                        getAndDisplayTheHeadlines(gameSchedule);
                    });

            })
            .catch (err => {
                console.log("An unexpected error occurred in handleWebpage: " + err.statusText);                
            });
     });
}


 $(handleWebpage);