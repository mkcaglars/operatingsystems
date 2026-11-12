<?php
declare(strict_types=1);
require __DIR__ . '/api/lib/bootstrap.php';
start_session();
$_SESSION = [];
session_destroy();
header('Location: ' . base_path() . '#/giris', true, 302);
