var playerMarkers = [];
var infoWindowsArray = [];
var foundPlayerMarkers = null;
var validDimensions = ["", " - overworld", " - nether", " - end"];
var playerIcons = [];

// Custom configuration
var imageURL = "playermarkers/";
var defaultImage = 'player.png';
var usingSkinRestorer = true;
var playerInfoURL = 'https://playerdb.co/api/player/minecraft/';

var markerFile = 'playermarkers/markers.json';
var refreshRate = 1000; 

var defaultPlayerIcon = L.icon({
	iconUrl: 'playermarkers/player.png',
	iconSize:     [16, 32], // size of the icon
	shadowSize:   [0, 0], // size of the shadow
	iconAnchor:   [8, 16], // point of the icon which will correspond to marker's location
	shadowAnchor: [0, 0],  // the same for the shadow
	popupAnchor:  [8, -8] // point from which the popup should open relative to the iconAnchor
});	


$(document).ready(function() {
	$.ajaxSetup({ cache: false });
	setInterval(updatePlayerMarkers, refreshRate * 2);
	setTimeout(updatePlayerMarkers, refreshRate);
});

function prepareInfoWindow(infoWindow, item) {
	var playerOnline = (item.id == 4 ? "" : (item.id == 5 ? "<h3><i>offline</i></h3>" : ""))
  var c = 
	"<div class=\"infoWindow\" style='width: 300px'>\
	<table><tr><td><img src='" + getIcon(item,72) + "'/></td><td>\
	<h1>"+item.msg+"</h1>" + playerOnline + "\
	<p style='text-align: left;'>\
	X: "+item.x+"\
	&nbsp;&nbsp;Y: "+item.y+"\
	&nbsp;&nbsp;Z: "+item.z+"</p>\
	</td></tr></table>\
	</div>";
  if (c != infoWindow.getContent())
	infoWindow.setContent(c);
}

// Getting avatar image based on username.
// The first method is looking up the Minecraft username and get the original skin.
// TODO:
// Second method, for offline users is to look up the corresponding skin from SkinRestorer plugin's storage.
function getIcon(item, size, overlay) {
	//console.log("getting icon: " + item.msg);
	if(overlay == undefined || typeof(overlay) == undefined){
		overlay = false;
	}
	if(size == undefined || typeof(size) == undefined || size < 16){
		size = 24;
	}
	var returnURL;
	
	// Requesting official Minecraft skin of the player.
	$.post(imageURL + "getIcon.php", {
		username : item.msg,
		size     : 24,
		overlay  : true
	},  function(data) {
		//console.log(data);
	}, "json").success(function(data){
		if(data['code'] == "player.found"){
			var entryFound = false;
			for(var v=0;v<playerIcons.length;v++){
				//console.log(playerIcons[v].name + " -- " + item.msg);
				if(playerIcons[v].name  == item.msg){
					//console.log("entry found");
					entryFound = true;
					break;
				}
			}		
			var lIcon = L.icon({
				iconUrl: data['data']['player']['avatar'] + "?size=" + size + ((overlay) ? "&overlay" : "" ),
				/*shadowUrl: 'leaf-shadow.png',*/
				iconSize:     [24, 24], // size of the icon
				shadowSize:   [0, 0], // size of the shadow
				iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
				shadowAnchor: [0, 0],  // the same for the shadow
				popupAnchor:  [6, -6] // point from which the popup should open relative to the iconAnchor
			});				
			if(!entryFound){
				// this is a new player's skin				
				playerIcons.push({
					'name'   : item.msg,
					'icon' : lIcon
				});
			} else {
				// this is an existing player's skin
				for(var pI=0;pI<playerIcons.length;pI++) {
				   if(playerIcons[pI].name == item.msg){
					   playerIcons[pI].icon = lIcon;
				   }
				}
			}
		} else {
			//console.log("offline player?");
			// Grabbing official skin failed. Gathering offline skin information if SkinRestorer is installed.			
			if(usingSkinRestorer){
				// TODO: this is for now.
				playerIcons.push({
					'name'   : item.msg,
					'icon' : defaultPlayerIcon
				});	
			}
		}
	});
}

// The player dropdown menu. It shows a list of the logged in player that can be followed on the map.
// And, a checkbox to turn on or off the showing of offline players.
var controlDiv;
var playerDdl;
var offlineChk;
var sPlayerDropDownInsertAfter = ".leaflet-control-container .leaflet-top.leaflet-right .leaflet-control.worldcontrol";
function playerDropDown() {
	if(controlDiv == null || controlDiv == undefined){
	  // crating the container div for the player dropdown
	  controlDiv = document.createElement('div');
	  $(controlDiv).attr('id','playerDropDown');
	  $(controlDiv).attr('class','leaflet-control');
	  $(controlDiv).insertAfter($(sPlayerDropDownInsertAfter));
		  // first item; no selected player to follow.
		  playerDdl = document.createElement('select');
		  var select_html = '<select><option selected value="no"> - Follow a player - <\/option>';
		  select_html += '<\/select>';
		  $(playerDdl).html(select_html);
		  $(playerDdl).attr('id','ddlFollowPlayer');
	  $(controlDiv).html($(playerDdl));
	  
	  // A checkbox for whether to show or not offline players.
  	  var checkOffline_html = '<div class="checkbox-container"><input id="chkOfflinePlayer" type="checkbox" value="true" \/> <label for="chkOfflinePlayer" style="color: #333;">Show offline players</label></div>';
	  $(controlDiv).append(checkOffline_html);
	}   
	// Filling up the player dropdown menu.
	for (player in playerMarkers) {
		var playerName = playerMarkers[player].options.title.replace(" - offline", "").replace("offline", "");
		var playerId = "player_" + playerName;
		if($('#playerDropDown option[id="' + playerId + '"').length < 1){
			$(playerDdl).append('<option id="' + playerId + '" value="'+playerName+'">'+ playerName +'</option>');
		}
	  
	}
}


function getPlayerIcon(name){
	for(var pI=0;pI<playerIcons.length;pI++) {	
		if(playerIcons[pI].name.toUpperCase().indexOf(name.toUpperCase()) > -1){
			return playerIcons[pI];
		}
	}
	return null;
}

function updatePlayerMarkers() {
	// Call the dropdown
	playerDropDown();
	// Reading the JSON with timestamp so it never will get cached.
	var playerInfoURL = markerFile + '?' + Math.round(new Date().getTime());
	
	// Ajax call to read the JSON
	$.getJSON(playerInfoURL, function(data) {
		var foundPlayerMarkers = [];
		for (i in playerMarkers) foundPlayerMarkers.push(false);

		var curWorld = overviewer.current_world;
		for (i in data) {
			var item = data[i];
			if(item.id != 4 && item.id != 5) continue; // 4=online, 5=offline, 6=sneaking, 7=invisible, 8=spectator
			var onCurWorld = false;
			for (var i=0; i<validDimensions.length; i++) {
				if (item.world.toUpperCase() + validDimensions[i].toUpperCase() == curWorld.toUpperCase()) {
					onCurWorld = true;
					break;
				}
			}
			if (!onCurWorld) continue;
			
			getIcon(item);
			
			var currWorld = overviewer.current_world;
			var currTileSet = overviewer.current_layer[currWorld]
			var ovconf = currTileSet.tileSetConfig;
			var converted = overviewer.util.fromWorldToLatLng(
				item.x, 
				item.y, 
				item.z, 
				ovconf
			);
			var playerOnline = (item.id == 4 ? "" : (item.id == 5 ? " - offline" : ""))
			
			//if found, change position
			var found = false;
			var showOffline = $(chkOfflinePlayer).is(":checked");
			for (player in playerMarkers) {
				if(playerMarkers[player].options.title.indexOf(item.msg) > -1) {
					//console.log(item.msg + playerOnline);
					foundPlayerMarkers[player] = found = true;
					playerMarkers[player].setLatLng(converted);
					var playerIcon = getPlayerIcon(item.msg);
					//console.log(playerIcon);
					if(playerIcon != null){
						playerMarkers[player].setIcon(playerIcon['icon']);
					} else {
						playerMarkers[player].setIcon(defaultPlayerIcon);
					}
			  
					if(item.id == 4 || showOffline) {
						//console.log(item.msg + " - " + "has layer");
						if(!overviewer.map.hasLayer(playerMarkers[player])) {
							playerMarkers[player].addTo(overviewer.map);
						}
					}
					else {
						overviewer.map.removeLayer(playerMarkers[player]);
					}
				
				  if($('#ddlFollowPlayer').val() == item.msg) {
					overviewer.map.panTo(converted);
				  }
				  //TODO: infowindow
				  //prepareInfoWindow(infoWindowsArray[player], item);
				  break;
				}
			  }
			  //else new marker
			  if(!found) {
				 /*var marker = new google.maps.Marker({
				  position: converted,
				  map: overviewer.map,
				  title: item.msg + playerOnline,
				  //icon: imageURL+'?'+playerOnline+"?small?"+item.msg,
				  icon: getIcon(item),
				  visible: true,
				  zIndex: 999
				});*/
				var marker = L.marker(
					converted,
					{
						icon:  this.icon,
						title: item.msg + playerOnline,
						
					}
				);
				playerMarkers.push(marker);
				
				//TODO: infowindow stuff
				/*
				var infowindow = new google.maps.InfoWindow({content: item.msg});
				prepareInfoWindow(infowindow, item);
				google.maps.event.addListener(marker, 'click', function(event) {
				  var i = 0;
				  for (playerindex in playerMarkers) {
					if (playerMarkers[playerindex].title == this.title) {
					  i = playerindex;
					  break;
					}
				  }
				  if(infoWindowsArray[i].getMap()){
					infoWindowsArray[i].close()
				  } else {
					infoWindowsArray[i].open(overviewer.map, playerMarkers[i]);
				  }
				});
				infoWindowsArray.push(infowindow);
				*/
				foundPlayerMarkers.push(true);
			  }
			}
		
			//remove unused markers
			for (i in playerMarkers) {
			  if (!foundPlayerMarkers[i]) {
				overviewer.map.removeLayer(playerMarkers[i]);
			  }
			}
	});
}