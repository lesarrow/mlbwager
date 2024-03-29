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

/* TEAMKEY - a team mapping from the abbreviations return from the API to the complete team name. Used for 
    display purposes and also for searching news */

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
    gameid - used in future api calls to identify a particular game
    rank - the value of this game in terms of whether or not to make a bet
    visitorOdds, homeOdds - holds the odds to bet on each team
    rank - a numerical evaluation of the viability of betting on the game
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

    /* oddToString - converts odds value to be more readable */

    oddsToString(value) {
        if (value < 0)
            return "(" + value + ")";
        
        if (value > 0)
            return "(+" + value + ")";

        return "(nl)";
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

    /* An auxilliary method to display the value of the object */

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



/* buildListOfGames - takes the Json response from the API and converts it into an array of Game objects 
    responseJson - API response in JSON format
*/

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



/* displayTheStrikeouts - given the game schedule, displays the games in the strikeout section of the layout
    gameSchedule - array of game objects
*/

function displayTheStrikeouts(gameSchedule) {

    $('.strikeouts').empty();
    $('.strikeouts').append("<h3>Strikeouts - Games to Avoid</h3>");
    $('.strikeouts').append(`<ul class="strikeout-list">`);

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        if (gameSchedule[i].getRank() == 0) {
            gamesFound = true;

            let kListItem = `gamebox-${gameSchedule[i].getGameId()}`;
            $('.strikeout-list').append(`<li class="${kListItem} gamebox">`);

            $(`.${kListItem}`).append(`<p class="matchup">${gameSchedule[i].getFullVisitor()} ${gameSchedule[i].getVisitorOddsStr()} @ ` +
                `${gameSchedule[i].getFullHome()} ${gameSchedule[i].getHomeOddsStr()}</p>`);
            $(`.${kListItem}`).append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
            $('.strikeout-list').append("</li>");
        }
    }

    if (!gamesFound) {
        $('.strikeout-list').append(`<li class="no-games">No games listed</li>`);
    }

    $('.strikeouts').append("</ul>");

}


/* displayTheBunts - given the game schedule, displays the games in the bunt section of the layout
    gameSchedule - array of game objects
*/

function displayTheBunts(gameSchedule) {

    $('.bunts').empty();
    $('.bunts').append("<h3>Bunts - Good Bets But Riskier</h3>");
    $('.bunts').append(`<ul class="bunt-list">`);

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        let rank = gameSchedule[i].getRank();

        /* If the game is not a bunt, continue */
        if ((rank != 1) && (rank != -1))
            continue;
        else gamesFound = true;

        /* Bunts are ranked either 1 or -1 defining whether to bet on the home or visiting team. 
            Depending on the rank, the display is altered */

        let buntListItem = `gamebox-${gameSchedule[i].getGameId()}`;
        $('.bunt-list').append(`<li class="${buntListItem} gamebox">`);
        if (rank == 1) {
            $(`.${buntListItem}`).append(`<p class="matchup"><span class="betonme">${gameSchedule[i].getFullVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</span> @ ` +
                `${gameSchedule[i].getFullHome()} ${gameSchedule[i].getHomeOddsStr()}</p>`);
            $(`.${buntListItem}`).append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        else if (rank == -1) {
            $(`.${buntListItem}`).append(`<p class="matchup"><span class="betonme">${gameSchedule[i].getFullHome()} ${gameSchedule[i].getHomeOddsStr()}</span> vs ` +
                `${gameSchedule[i].getFullVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</p>`);
            $(`.${buntListItem}`).append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        $('.bunt-list').append("</li>");
    }

    if (!gamesFound) {
        $('.bunt-list').append(`<li class="no-games">No games listed</li>`);
    }

    $('.bunts').append("</ul>");


}


/* displayTheGrandSlams - given the game schedule, displays the games in the grand slam section of the layout
    gameSchedule - array of game objects
*/

function displayTheGrandSlams(gameSchedule) {

    $('.grandSlams').empty();
    $('.grandSlams').append("<h3>Grand Slams - Best Bets</h3>");
    $('.grandSlams').append(`<ul class="grandslam-list">`);

    let gamesFound = false;
    for (let i=0; i<gameSchedule.length; i++) {
        let rank = gameSchedule[i].getRank();

        /* If the game is not a grandslam, continue */

        if ((rank < 2) && (rank > -2))
            continue;
        else gamesFound = true;

        /* Grandslams are ranked either >=2 or <=-2 defining whether to bet on the home or visiting team. 
            Depending on the rank, the display is altered */

        let grandslamListItem = `gamebox-${gameSchedule[i].getGameId()}`;
        $('.grandslam-list').append(`<li class="${grandslamListItem} gamebox">`);
        if (rank >= 2) {
            $(`.${grandslamListItem}`).append(`<p class="matchup"><span class="betonme">${gameSchedule[i].getFullVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</span> @ ` +
                `${gameSchedule[i].getFullHome()} ${gameSchedule[i].getHomeOddsStr()}</p>`);
            $(`.${grandslamListItem}`).append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        else if (rank <= -2) {
            gamesFound = true;
            $(`.${grandslamListItem}`).append(`<p class="matchup"><span class="betonme">${gameSchedule[i].getFullHome()} ${gameSchedule[i].getHomeOddsStr()}</span> vs ` +
                `${gameSchedule[i].getFullVisitor()} ${gameSchedule[i].getVisitorOddsStr()}</p>`);
            $(`.${grandslamListItem}`).append(`<ul class="headlines" id="${gameSchedule[i].getGameId()}"></ul>`);
        }
        $('grandslam-list').append("</li>");
    }

    if (!gamesFound) {
        $('.grandslam-list').append(`<li class="no-games">No games listed</li>`);
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

//    document.getElementById("search-results").scrollIntoView();
}


/* responseInJson - created this function to reduce duplication of code and to have a single place to 
    make changes in case I decide to enhance this process */

function responseInJson(response) {

    if (response.ok)
        return response.json();
    else throw new Error(response.statusText);
   
}


/* getAndDisplayTheHeadlines - Fetches the headlines from the news API and displays them to the user 
    gameSchedule - array of Game objects
    debug - Boolean. If true, don't fetch and display test headlines instead. This is to conserve the fetch quota from the news API.
*/

function getAndDisplayTheHeadlines(gameSchedule, debug) {

    /* fetch and show up to 4 articles related to the teams playing in each game */

    for (let i=0; i<gameSchedule.length; i++) {

        let todaysDate = new Date();
        let fetchstr = (`${NEWSAPI_CALL}&from=${todaysDate.getFullYear()}-${todaysDate.getMonth()+1}-${todaysDate.getDate()}` +
            `&q="${gameSchedule[i].getFullVisitor()}"AND"${gameSchedule[i].getFullHome()}"`);
        if (!debug)
            fetch(fetchstr)
                .then(response => responseInJson(response))
                .then(responseJson => {
                
                    const MAX_NUMBER_OF_ARTICLES = 4;

                    let articlesToShow = MAX_NUMBER_OF_ARTICLES;

                    if (responseJson.totalResults < MAX_NUMBER_OF_ARTICLES)
                        articlesToShow = responseJson.totalResults;

                    /* Show links up to the MAX_NUMBER_OF_ARTICLES */

                    let gameID = gameSchedule[i].getGameId();
                    let headlineList = [];
                    let articlesShown = 0;
                    for (let j=0; j<responseJson.totalResults; j++) {
                        if (headlineList.indexOf(responseJson.articles[j].title) <= -1) {
                            $(`#${gameID}`).append(
                                `<li><a target="_blank" href="${responseJson.articles[j].url}">${responseJson.articles[j].title}</a></li>`);
                            headlineList.push(responseJson.articles[j].title);
                            articlesShown++;
                            if (articlesShown >= articlesToShow)
                                break;
                        }
                        else continue;
                    }
                })
                .catch(err => {
                    console.log("An unexpected error occurred in getAndDisplayTheHeadlines: " + err.statusText);    
                });             
        else {
            let gameID = gameSchedule[i].getGameId();
            for (let j=0; j<4; j++) 
                $(`#${gameID}`).append(`<li><a target="_blank" href=".">Test Link ${j}</a></li>`);
        }
    }

}


/* returns today's date in YYYY-MM-DD format */

function getTodaysDate() {

    let dateObj = new Date();

    let month = dateObj.getMonth()+1;
    if (dateObj.getMonth() < 10)
        month = "0" + month;

    let dateStr = dateObj.getDate();
    if (dateStr < 10)
        dateStr = "0" + dateStr;

    return dateObj.getFullYear() + "-" + month + "-" + dateStr;

}


/* setCursor - sets the cursor to the state of the paramter given
    state - the state to set the cursor to
*/

function setCursor(state) {
    $('*').css("cursor", state);
}


function handleWebpage() {

    /* Set the default date to today */

    $('#search-date').attr("value", getTodaysDate());
  
    /* Get the date from the user and use that to search what games are available */

    $('form').submit(e => {

        e.preventDefault();
        setCursor("progress");
    
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
                        getAndDisplayTheHeadlines(gameSchedule, false);
                    });

            })
            .then(() => {
                setCursor("default");
            })
            .catch (err => {
                $('.search-results').hide();
                console.log("An unexpected error occurred in handleWebpage: " + err.statusText);                
                $('.search-error').empty();
                $('.search-error').append(`An unexpected error occurred in handleWebpage: ${err.statusText}`);
                $('search-error').show();
                setCursor("default");
            });
     });
}


 $(handleWebpage);