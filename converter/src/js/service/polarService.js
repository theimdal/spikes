function importXmlToJson(type, path, callback) {
  var fs = require('fs');
  var xml2js = require('xml2js');
  var json;
  try {
      var fileData = fs.readFileSync(path, 'utf-8');

      var parser = new xml2js.Parser();
      parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
        json = result;
      });

      console.log("File '" + path + "/ was successfully read.\n");
      callback(type, json);
  } catch (ex) {
    console.log(ex)
  }
}

function buildTcx(trainingJson, gpxJson) {
  console.log('start building');

  var exercise = trainingJson['polar-exercise-data']['calendar-items'][0]['exercise'][0];
  var startTime = new Date(exercise['time'][0]);
  var startTimeISOString = startTime.toISOString();

  var sport = exercise['sport'][0];

  var exerciseSummary = exercise['result'][0];
  var duration = exerciseSummary['duration'];
  var calories = exerciseSummary['calories'];
  var distance = exerciseSummary['distance'];

  // DEBUG
  console.log('startTime: ' + startTime);
  console.log('sport: ' + sport);
  console.log('duration: ' + duration);
  console.log('calories: ' + calories);
  console.log('distance: ' + distance);
  // DEBUG

  var laps = exerciseSummary['laps'][0]['lap'];

  console.log('Number of laps: ' + laps.length);
  console.log('Lap duration: ' + laps[0].duration);

  var builder = require('xmlbuilder');
  var root = builder.create('TrainingCenterDatabase', {version: '1.0', endcoding: 'UTF-8', standalone: true});
  root.att('xsi:schemaLocation', 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd');
  root.att('xmlns:ns5', 'http://www.garmin.com/xmlschemas/ActivityGoals/v1');
  root.att('xmlns:ns3', 'http://www.garmin.com/xmlschemas/ActivityExtension/v2');
  root.att('xmlns:ns2', 'http://www.garmin.com/xmlschemas/UserProfile/v2');
  root.att('xmlns', 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2');
  root.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

  var nodeActivities = root.element('Activities');

  var nodeActivity = nodeActivities.element('Activity', {Sport: sport});
  console.log(startTime.toISOString());
  nodeActivity.element('Id', startTimeISOString);

  var lapStartTime = new Date(startTime.getTime());
  for(var i = 0; i < laps.length; i++) {
    var lap = laps[i];
    //console.log('Lap number: ' + i);

    var totalSecondsAndMilliseconds = extractSecondsAndMillisecondsFromDurationString(lap.duration[0]);

    var nodeLap = nodeActivity.element('Lap', {StartTime: lapStartTime.toISOString()});
    nodeLap.element('TotalTimeSeconds', totalSecondsAndMilliseconds.seconds);
    nodeLap.element('DistanceMeters', lap.distance[0]);
    nodeLap.element('Calories', '0');

    var nodeAverageHeartRateBpm = nodeLap.element('AverageHeartRateBpm');
    var averageHeartRate = lap['heart-rate'][0].average[0];
    nodeAverageHeartRateBpm.element('Value', averageHeartRate);

    var nodeMaximumHeartRateBpm = nodeLap.element('MaximumHeartRateBpm');
    var maxHeartRateBpm = lap['heart-rate'][0].maximum[0];
    nodeMaximumHeartRateBpm.element('Value', maxHeartRateBpm);

    if(parseInt(averageHeartRate) > 100) {
      nodeLap.element('Intensity', 'Active');
    } else { nodeLap.element('Intensity', 'Resting'); }

    nodeLap.element('TriggerMethod', 'Manual');

    var nodeTrack = nodeLap.element('Track');

    var lapEndTime = new Date(lapStartTime.getTime());
    lapEndTime.setSeconds(lapEndTime.getSeconds() + totalSecondsAndMilliseconds.seconds);
    lapEndTime.setMilliseconds(lapEndTime.getMilliseconds() + totalSecondsAndMilliseconds.milliseconds);

    // console.log('Lap start: ' + lapStartTime);
    // console.log('Lap end:' + lapEndTime);

    var trackPoints = extractTrackPoints(lapStartTime, lapEndTime, gpxJson);

    for(j = 0; j < trackPoints.length; j++) {

      var trackPoint = trackPoints[j];

      var nodeTrackPoint = nodeTrack.element('Trackpoint');
      nodeTrackPoint.element('Time', trackPoint.time);

      var nodePosition = nodeTrackPoint.element('Position');
      nodePosition.element('LatitudeDegrees', trackPoint.latitudeDegrees);
      nodePosition.element('LongitudeDegrees', trackPoint.longitudeDegrees);

      nodeTrackPoint.element('AltitudeMeters', trackPoint.altitudeMeters);
      //nodeTrackPoint.element('DistanceMeters', '');
      nodeTrackPoint.element('HeartRateBpm').element('Value', averageHeartRate);

      // var nodeExtensions = nodeTrackPoint.element('Extensions');
      // var nodeExtensionsTpx = nodeExtensions.element('TPX', {xmlns: 'http://www.garmin.com/xmlschemas/ActivityExtension/v2'});
      // nodeExtensionsTpx.element('Speed', '');
    }

    lapStartTime = new Date(lapEndTime.getTime());
  }

  // debug
  console.log('finished buidling');
  // console.log(root.end({ pretty: true, indent: '  ', newline: '\n' }));
  return root;
};

function extractTrackPoints(startTime, endTime, gpxJson) {
  var trackPoints = [];

  var jsonTrackingPointsArray = gpxJson.gpx.trk[0].trkseg[0].trkpt;

  for(i = 0; i < jsonTrackingPointsArray.length; i++) {
    var point = jsonTrackingPointsArray[i];
    var stringTime = point.time[0];
    var time = new Date(stringTime);
    if(time.getTime() >= startTime.getTime() && time.getTime() <= endTime.getTime()) {
      trackPoints.push({time: stringTime, altitudeMeters: point.ele[0], latitudeDegrees: point.$.lat, longitudeDegrees: point.$.lon});
    } else if(time.getTime() > endTime.getTime()) {
      return trackPoints;
    }
  }

  return trackPoints;

}

function extractSecondsAndMillisecondsFromDurationString(durationString) {
  var result = {};
  var totalSeconds = 0;
  var parts = durationString.split(':');
  var hours = parts[0];
  var minutes = parts[1];

  var secondsAndMilliseconds = parts[2].split('.');
  var seconds = secondsAndMilliseconds[0];
  var milliseconds = secondsAndMilliseconds[1];

  if (hours) { totalSeconds += parseInt(hours)*3600; }
  if (minutes) { totalSeconds += parseInt(minutes)*60; }
  if (seconds) { totalSeconds += parseInt(seconds); }

  result.seconds = totalSeconds;
  if(milliseconds) {
    result.milliseconds = parseInt(milliseconds);
  } else {
    result.milliseconds = 0;
  }

  return result;
}

spikeApp.factory('polarConverterFactory', function () {

  var Converter = {};

  Converter.run = function() {
    var fs = require('fs');
    var files = [];
    files.push({type: 'training', path: './data/import_from_polar/theimdal_15.07.2015_export.xml'});
    files.push({type: 'gpx', path: './data/import_from_polar/exercise-2015-5-22.gpx'});
    var jsonData = {};

    files.forEach(function(file) {
      importXmlToJson(file.type, file.path, function(type, json) {
        jsonData[type] = json;
      });

      if(Object.keys(jsonData).length == files.length) {
        var resultXml = buildTcx(jsonData['training'], jsonData['gpx']);
        fs.writeFile('./output/tcx.tcx', resultXml.end({ pretty: true, indent: '  ', newline: '\n' }), function(err) {
          if(err) {
            console.log(err);
            return err;
          }
          console.log('File was saved.');
          return "All ok";
        });
      }
    });
  }

  return Converter;
});
