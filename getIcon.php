<?php
	if(isset($_GET['noaction'])){
		die();
	}
	$imageURL          = "./";
	$defaultImage      = 'player.png';
	$usingSkinRestorer = true;
	$playerInfoURL     = 'https://playerdb.co/api/player/minecraft/';
	$skinRestorerPath  = "/path/to/skinrestorer/";

	$size = 24;
	$overlay = true;

	if(!isset($_POST['size'])){
		$size = 24;
	} else {
		if($_POST['size'] < 16){
			$size = 24;
		} else {
			$size = $_POST['size'];
		}
	}
	if(!isset($_POST['overlay'])){
		$overlay = true;
	} else {
		$overlay = $_POST['overlay'];
	}
	if(isset($_GET['user'])){
		$_POST['username'] = $_GET['user'];
	}
	if(!isset($_POST['username'])){
		die("No user specified.");
	}


	if($usingSkinRestorer && file_exists($skinRestorerPath . strtolower($_POST['username']) . ".skin")){
		$line = "";
		$file = $skinRestorerPath . strtolower($_POST['username']) . ".skin";
		if($f = fopen($file, 'r')){
		  $line = fgets($f); // read until first newline
		  fclose($f);
		}
		//echo $line;
		$result = json_decode(base64_decode($line));
		//echo $result->textures->SKIN->url;
		//downloadFile($result->textures->SKIN->url, "./tmp/" . $_POST['username']);
		if(!isset($result->textures->SKIN)){
			goto onlinemethod;
		}
		$skinfile = imagecreatefrompng($result->textures->SKIN->url);
		$headO = imagecrop($skinfile, [
			'x'      => 8,
			'y'      => 8,
			'width'  => 8,
			'height' => 8
		]);
		$head = imagescale($headO, $size, $size, IMG_NEAREST_NEIGHBOUR);
		$hatO = imagecrop($skinfile, [
			'x'      => 40,
			'y'      => 8,
			'width'  => 8,
			'height' => 8
		]);
		$hat = imagescale($hatO, $size, $size, IMG_NEAREST_NEIGHBOUR);
		
		$background = imagecolorallocate($hat, 0, 0, 0);
		imagecolortransparent($hat, $background);
		imagealphablending($hat, false);
		imagesavealpha($hat, true);
		imagecopymerge(
			$head,
			$hat,
			0,
			0,
			0,
			0,
			8,
			8,
			100);
		imagepng($head, 'heads/' . $_POST['username'] . ".png");
		imagedestroy($skinfile);
		imagedestroy($head);
		imagedestroy($headO);
		imagedestroy($hat);
		imagedestroy($hatO);
		$jsonRespArr = array(
			"code" => "player.found",
			"message" => "Successfully found player by given ID.",
			"data" => array(
				"player" => array(
					"username" => $_POST['username'],
					"avatar"   => "./playermarkers/heads/" . $_POST['username'] . ".png"
				)
			)
		);
		$jsonResp = json_encode($jsonRespArr, JSON_UNESCAPED_SLASHES);
		echo $jsonResp;
	} else {
onlinemethod:		
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_URL, $playerInfoURL . $_POST['username'] . "?s=" . $size . (($overlay) ? "&overlay" : ""));
		$result = curl_exec($ch);
		curl_close($ch);

		$obj = json_decode($result);
		if($obj->code == "player.found"){
			echo $result;
		} else {
			echo "";		
		}
	}

	function downloadFile($url, $path){
		$newfname = $path;
		$file = fopen ($url, 'rb');
		if ($file) {
			mkdir("./tmp", 0777, true);
			$newf = fopen ($newfname, 'wa+');
			if ($newf) {
				while(!feof($file)) {
					fwrite($newf, fread($file, 1024 * 8), 1024 * 8);
				}
			}
		}
		if ($file) {
			fclose($file);
		}
		if ($newf) {
			fclose($newf);
		}
	}
?>