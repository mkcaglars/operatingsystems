<?php
// PHP kural motoru testi. Kullanım:
//   php tests/php/rules_test.php          → kural durumlarını beklenen sonuçla karşılaştırır
//   php tests/php/rules_test.php --json   → tüm sonuçları JSON olarak yazar (TS ile karşılaştırma için)
declare(strict_types=1);
require __DIR__ . '/../../server/api/lib/rules.php';

$fx = json_decode((string)file_get_contents(__DIR__ . '/../fixtures/rules.json'), true);
$ctx = ['state' => $fx['durum'], 'events' => $fx['olaylar']];

$ruleResults = [];
foreach ($fx['kurallar'] as $c) $ruleResults[] = rule_evaluate($c['kural'], $ctx);
$scoreResults = [];
foreach ($fx['puanlama'] as $p) $scoreResults[] = score_task($fx['gorev'], $ctx, (float)$p['sure'], (int)$p['ipucu']);

if (in_array('--json', $argv, true)) {
    echo json_encode(['kurallar' => $ruleResults, 'puanlama' => $scoreResults], JSON_UNESCAPED_UNICODE);
    exit(0);
}

$fail = 0;
foreach ($fx['kurallar'] as $i => $c) {
    if ($ruleResults[$i] !== $c['beklenen']) {
        $fail++;
        echo "BAŞARISIZ: {$c['ad']} → " . var_export($ruleResults[$i], true) . PHP_EOL;
    }
}
echo count($fx['kurallar']) - $fail . '/' . count($fx['kurallar']) . " kural testi geçti" . PHP_EOL;
exit($fail ? 1 : 0);
