<?php
$db = new mysqli("localhost", "engine", "Eng1nE", "engine");
if (!$db)
	$res = ".-=-(001) Не могу подключиться к базе данных по причине: ".mysqli_connect_error();

ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
//------------------------------------------------------

// ------- Common DB functions start -------

function getFreeID($table) {

    global $db;

	//throw new Exception("SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    $query = $db->query("SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    if (!$query)
    	return 0;

    $id = 1;
		if ($query->num_rows)
	    while ($row = $query->fetch_array()) {
	        if ($id != $row["id"])
	            break;
	        $id++;
	    }

    return $id;

} // getFreeID
//------------------------------------------------------

function insertLastParam($field, $param) {

    global $db;

    $query = $db->query("UPDATE lastParams SET ".$field."='".$param."' WHERE active=1");
    if (!$query)
        return false;

    return true;

} // insertLastParam
//------------------------------------------------------

function dbError($result) {

	global $db;

	$result["result"] = "error";
	$result["message"] = "DB error: ".$db->error;

	return $result;

} // dbError
//------------------------------------------------------

// ------- Common DB functions end -------
?>
