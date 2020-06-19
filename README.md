# PlayerMarkersLeaflet
Updated and modified web elements for PlayerMarkers Minecraft plugin to work with the updated Minecraft Overviewer utility

This is a modified version of the [PlayerMarkers](https://dev.bukkit.org/projects/mapmarkers) Bukkit plugin.


The original plugin worked with older versions of Minecraft [Overviewer](https://overviewer.org/) which used the Google Maps Platform. Since an update, the project moved to Leaflet, thus the Minecraft plugin functionality broke.

This project contains and updated **playermarkers.js** file and a PHP script to get the corresponding Minecraft skin for players to show them on the Overviewer map.

The PHP script can get skin information from [SkinRestorer](https://www.spigotmc.org/resources/skinsrestorer.2124/) plugin. This can be disabled.
The PHP scripts uses GD library to create the avatar image used on the map.

There **are** bugs I know about. Probably will be fixed in the future.
