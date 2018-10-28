<?php
//echo "start";
$res = "";
$db = mysqli_connect("localhost", "root", "5ql@dmin", "engine");
if (!$db)
	$res = ".-=-(001) Не могу подключиться к базе данных по причине: ".mysqli_connect_error();

if ($res == "") {
    mysqli_query($db, "SET NAMES utf8");
    if (isset($_POST["command"])) {
        switch ($_POST["command"]) {
            case "saveEngine" :
                $res = saveEngine($_POST["title"], $_POST["data"]);
                break;
            default :
                $res = "unknown command";
        }
    }
}

echo $res;

function saveEngine($title, $data) {

    global $db;

    try {

        $query = mysqli_query($db, "SELECT COUNT(oborots) AS Count FROM engines WHERE title='".$title."'");
        if (!$query)
            throw new Exception("(002) Не могу работать с таблицами БД");

        $recordsExists = true;
        if ($row = mysqli_fetch_array($query))
            $recordsExists = $row["Count"] != 0;

        if ($recordsExists) {
            $query = mysqli_query($db, "DELETE FROM engines WHERE title='".$title."'");
            if (!$query)
                throw new Exception("(003) Не могу работать с таблицами БД");
        }

        $data = explode(";", $data);
        if (count($data) != 2)
            throw new Exception("(004) Не верные данные для записи в БД");

        $obs = explode(",", $data[0]);
        $moms = explode(",", $data[1]);

        for ($c = 0; $c < count($obs); $c++) {
            $query = mysqli_query($db, "INSERT INTO engines(title, oborots, momentum, dateSave) VALUES('".$title."', ".$obs[$c].", ".$moms[$c].", '".date("Y-m-d H:i:s")."')");
            if (!$query)
                throw new Exception("(005) Не могу работать с таблицами БД");
        }

    }
    catch (Exception $e) {
        return ".-=-".$e;
    }

    return "ok-=-";

}
//------------------------------------------------------
?>