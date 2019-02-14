<?php
$db = new mysqli("localhost", "engine", "Eng1nE", "engine");
if (!$db)
	$res = ".-=-(001) Не могу подключиться к базе данных по причине: ".mysqli_connect_error();
//------------------------------------------------------

// ------- Common DB functions start -------

function getFreeID($table) {

    global $db;

	//throw new Exception("SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    $query = $db->query("SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    if (!$query)
    	return 0;

    $id = 1;
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

// ------- Common DB functions end -------
?>
