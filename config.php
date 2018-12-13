<?php
$db = mysqli_connect("localhost", "engine", "Eng1nE", "engine");
if (!$db)
	$res = ".-=-(001) Не могу подключиться к базе данных по причине: ".mysqli_connect_error();
?>