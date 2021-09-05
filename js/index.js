/*
    GLOBAL VARIABLES
*/
"use strict";

//API Endpoint
//cors-anywhere is a proxy server workaround for CORS policy restricting the data
var APIURL = "http://data.covid19india.org/v4/min/timeseries.min.json";
//ID Variables for canvases
var cID = undefined;
var vID = undefined;
var rID = undefined;
var dID = undefined;

//Object containing HTML ELements required for DOM Manipulation
var elements = {
    stateName: document.getElementById("stateName"),
    confirmedCases: document.getElementById("confirmedCases"),
    recoveredCases: document.getElementById("recoveredCases"),
    testedCases: document.getElementById("testedCases"),
    deceasedCases: document.getElementById("deceasedCases"),
    vaccineOne: document.getElementById("vaccineOne"),
    vaccineTwo: document.getElementById("vaccineTwo"),
    rNumber: document.getElementById("rNumber"),
    transmission: document.getElementById("transmission"),
    lockdown: document.getElementById("lockdown"),
};

var settings = {
    cache: false,
    dataType: "json",
    async: true,
    crossDomain: true,
    url: APIURL,
    method: "GET",
    headers: {
        accept: "application/json",
        "Access-Control-Allow-Origin": "*",
    },
};

//Receiving the Total Count for each data field and displaying on the page
function getStateDetails(state) {
    //Handling Invalid selected Option
    if (state === "UN") {
        alert("Please select a valid state!");
    } else {
        $.getJSON(APIURL, function (data) {
            //Getting Today and Yesterday's Date for R-Index Evaluation
            var today = new Date();
            today.setDate(today.getDate() - 1);
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 2);

            // Storing the Detail object from the Response data into a variable
            var details = data[state]["dates"][getISODate(today)]["total"];

            //Calculating R Index, transmission and Lockdown Requirement
            var assessment = getAssessment(
                data[state]["dates"][getISODate(today)]["delta7"]["confirmed"],
                data[state]["dates"][getISODate(yesterday)]["delta7"][
                    "confirmed"
                ]
            );
            //Displaying stastical data of each fields in the state Card
            elements.confirmedCases.innerHTML = decimalConvert(
                details.confirmed
            );
            elements.recoveredCases.innerHTML = decimalConvert(
                details.recovered
            );
            elements.vaccineOne.innerHTML = decimalConvert(details.vaccinated1);
            elements.vaccineTwo.innerHTML = decimalConvert(details.vaccinated2);
            elements.deceasedCases.innerHTML = decimalConvert(details.deceased);
            elements.testedCases.innerHTML = decimalConvert(details.tested);
            elements.rNumber.innerHTML = assessment.rNumber;
            elements.transmission.innerHTML = assessment.transmission;
            elements.lockdown.innerHTML = assessment.lockdown;

            // //Applying Color Classes to last Three Elements
            elements.rNumber.className = "";
            elements.transmission.className = "";
            elements.lockdown.className = "";
            elements.rNumber.classList.add(assessment.color);
            elements.transmission.classList.add(assessment.color);
            elements.lockdown.classList.add(assessment.color);
        });
    }
}
//Receiving the Timeseries Data and Plotting them on Graphs
function getStateTimeSeries(state) {
    var obj = [];
    //Handling Invalid Selected Option
    if (state === "UN") {
        drawGraph(
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        );
        document.getElementById("dataWrapper").classList.add("hidden");
    } else {
        $.getJSON(APIURL, function (data) {
            //Extracting Data from the given state timeseries
            var dates = [];
            var statistics = [];

            $.each(data[state]["dates"], function (id, obj) {
                dates.push(id);
                statistics.push(obj.delta7);
            });

            //Creating dataset Arrays for Data Visualization
            var confirmedDataset = [];
            var recoveredDataset = [];
            var deceasedDataset = [];
            var vaccinatedDataset = [];

            statistics.forEach(function (item, index) {
                if (item) {
                    item.confirmed
                        ? confirmedDataset.push(item.confirmed)
                        : confirmedDataset.push(0);
                    item.recovered
                        ? recoveredDataset.push(item.recovered)
                        : recoveredDataset.push(0);
                    item.deceased
                        ? deceasedDataset.push(item.deceased)
                        : deceasedDataset.push(0);
                    item.vaccinated1
                        ? vaccinatedDataset.push(item.vaccinated1)
                        : vaccinatedDataset.push(0);
                }
            });
            //Plotting Graphs from received datasets
            drawGraph(
                dates,
                confirmedDataset,
                recoveredDataset,
                vaccinatedDataset,
                deceasedDataset
            );
            document.getElementById("dataWrapper").classList.remove("hidden");
        });
    }
}
//Draw Graph of the given DataSet on specified Canvas
function drawGraph(
    dates,
    confirmedDataset,
    recoveredDataset,
    vaccinatedDataset,
    deceasedDataset
) {
    //Selecting the respective Canvas elements
    var ctxConfirmed = document.getElementById("confirmedCanvas");
    var ctxRecovered = document.getElementById("recoveredCanvas");
    var ctxVaccinated = document.getElementById("vaccinatedCanvas");
    var ctxDeceased = document.getElementById("deceasedCanvas");

    /*
    If any previous graph had been plotted,
    this snipppet will destroy those instances
    in order to plot new graphs.
  */
    if (cID) {
        cID.destroy();
        vID.destroy();
        rID.destroy();
        dID.destroy();
    }
    /*
    New Charts are plotted and their chartID
    are assigned to global variables to keep
    track of any charted graphs
    */
    cID = chartInitialise(
        ctxConfirmed,
        "Confirmed Cases",
        dates,
        confirmedDataset,
        "#56B1DF",
        "#56B1DF21"
    );
    rID = chartInitialise(
        ctxRecovered,
        "Recovered Cases",
        dates,
        recoveredDataset,
        "#D8DF7C",
        "#D8DF7C21"
    );
    vID = chartInitialise(
        ctxVaccinated,
        "Vaccinated Cases",
        dates,
        vaccinatedDataset,
        "#77D37A",
        "#77D37A21"
    );
    dID = chartInitialise(
        ctxDeceased,
        "Deceased Cases",
        dates,
        deceasedDataset,
        "#E76262",
        "#E7626221"
    );
}
/*
    Utility Functions
*/

//1. function to convert given date into ISO Format
function getISODate(d) {
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, 0);
    var date = String(d.getDate()).padStart(2, 0);
    var str = `${year}-${month}-${date}`;
    return str;
}
//2. function to convert given integer into Indian Decimal System Notation.
function decimalConvert(n) {
    var x = n.toString();
    var lastThree = x.substring(x.length - 3);
    var otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers != "") lastThree = "," + lastThree;
    var str = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return str;
}
//3. Generate a JSON Template String for given inputs
function chartInitialise(
    ctx,
    labelString,
    dates,
    dataSet,
    chartColor,
    fillColor
) {
    /*
    Creating option object for tweaking
    settings for the plotting of charts
  */
    var options = {
        scales: {
            x: {
                ticks: {
                    display: false,
                },
                grid: {
                    color: "#0000",
                    borderColor: chartColor,
                    borderWidth: 2,
                },
            },
            y: {
                ticks: {
                    color: chartColor,
                },
                grid: {
                    color: "#0000",
                    borderColor: chartColor,
                    borderWidth: 2,
                },
            },
        },
    };
    /*
    Chart instance to be generated at the
    canvas Element passed in argument. The
    Chart Id is returned by the function
  */
    var a = new Chart(ctx, {
        type: "line",
        data: {
            labels: dates,
            datasets: [
                {
                    xAxisID: "x",
                    yAxisID: "y",
                    label: labelString,
                    data: dataSet,
                    backgroundColor: chartColor,
                    borderColor: chartColor,
                    pointRadius: 1,
                    fill: {
                        target: "origin",
                        above: fillColor,
                    },
                },
            ],
        },
        options: options,
    });
    return a;
}
//4.
function getAssessment(todayCases, yesterdayCases) {
    //Initialiszing data to be passed os output by the function
    var transmission;
    var lockdown;
    var color;
    var obj = {};

    //Evaluating Requirement
    var rNumber = todayCases / yesterdayCases;
    if (rNumber < 1) {
        transmission = "Low";
        lockdown = "None";
        color = "text-success";
    } else if (1 <= rNumber <= 2) {
        transmission = "Moderate";
        lockdown = "Partial";
        color = "text-warning";
    } else {
        transmission = "High";
        lockdown = "Complete";
        color = "text-danger";
    }

    obj.rNumber = parseFloat(rNumber).toFixed(2);
    obj.transmission = transmission;
    obj.lockdown = lockdown;
    obj.color = color;

    return obj;
}
/*
    PAGE ONLOAD
*/
$(document).ready(function () {
    //Enumerating the Header Columns into single Object for easier DOM Manipulation
    var nationGroups = {};
    nationGroups.confirmed = document.getElementById("confirmedData");
    nationGroups.recovered = document.getElementById("recoveredData");
    nationGroups.vaccinated = document.getElementById("vaccinatedData");
    nationGroups.deceased = document.getElementById("deceasedData");

    //Data being fetched from the API and displayed into header Columns
    $.getJSON(APIURL, function (data) {
        var today = new Date();
        today.setDate(today.getDate() - 1);
        var obj = data["TT"]["dates"][getISODate(today)]["delta7"];

        nationGroups.confirmed.innerHTML = decimalConvert(obj.confirmed);
        nationGroups.recovered.innerHTML = decimalConvert(obj.recovered);
        nationGroups.vaccinated.innerHTML = decimalConvert(obj.vaccinated1);
        nationGroups.deceased.innerHTML = decimalConvert(obj.deceased);
    });
});
/* 
    MAIN SCRIPT
*/

$("#stateSubmit").click(function () {
    var a = $("#statesList").val();
    var stateName = $("#statesList option:selected").text();

    getStateDetails(a);
    $("#stateName").text(stateName);
    getStateTimeSeries(a);
});
