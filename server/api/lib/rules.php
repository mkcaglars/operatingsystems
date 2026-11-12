<?php
// Görev kural motoru ve puanlama — web/src/core/rules.ts ve scoring.ts'nin PHP karşılığı.
// İki uygulama tests/fixtures/rules.json ile aynı sonucu vermelidir. Birini değiştirirseniz diğerini de değiştirin.
declare(strict_types=1);

final class RuleMissing
{
    public static function get(): self
    {
        static $i = null;
        return $i ??= new self();
    }
}

function rule_is_missing(mixed $v): bool
{
    return $v instanceof RuleMissing;
}

function rule_split_path(string $path): array
{
    $p = preg_replace('/\[(\d+)\]/', '.$1', $path);
    return array_values(array_filter(explode('.', (string)$p), fn($x) => $x !== ''));
}

function rule_get_path(mixed $obj, string $path): mixed
{
    $cur = $obj;
    foreach (rule_split_path($path) as $key) {
        if (rule_is_missing($cur) || !is_array($cur)) return RuleMissing::get();
        if (array_is_list($cur)) {
            if (!preg_match('/^\d+$/', $key)) return RuleMissing::get();
            $i = (int)$key;
            if ($i >= count($cur)) return RuleMissing::get();
            $cur = $cur[$i];
        } else {
            if (!array_key_exists($key, $cur)) return RuleMissing::get();
            $cur = $cur[$key];
        }
    }
    return $cur;
}

function rule_is_num(mixed $v): bool
{
    return (is_int($v) || is_float($v)) && is_finite((float)$v);
}

function rule_deep_equal(mixed $a, mixed $b): bool
{
    if (rule_is_missing($a) || rule_is_missing($b)) return false;
    if (rule_is_num($a) && rule_is_num($b)) return (float)$a === (float)$b;
    if (is_array($a) && is_array($b)) {
        if (count($a) === 0 && count($b) === 0) return true;
        $la = array_is_list($a);
        $lb = array_is_list($b);
        if ($la !== $lb) return false;
        if (count($a) !== count($b)) return false;
        if ($la) {
            foreach ($a as $i => $x) if (!rule_deep_equal($x, $b[$i])) return false;
            return true;
        }
        foreach ($a as $k => $x) {
            if (!array_key_exists($k, $b) || !rule_deep_equal($x, $b[$k])) return false;
        }
        return true;
    }
    return $a === $b;
}

function rule_check_count(int $n, ?array $c): bool
{
    if ($c === null) return $n >= 1;
    if (isset($c['eq']) && $n != $c['eq']) return false;
    if (isset($c['gte']) && $n < $c['gte']) return false;
    if (isset($c['lte']) && $n > $c['lte']) return false;
    if (isset($c['gt']) && $n <= $c['gt']) return false;
    if (isset($c['lt']) && $n >= $c['lt']) return false;
    return true;
}

function rule_event_matches(array $e, string $type, ?array $where): bool
{
    if (($e['type'] ?? null) !== $type) return false;
    if (!$where) return true;
    foreach ($where as $k => $v) {
        $ev = array_key_exists($k, $e) ? $e[$k] : RuleMissing::get();
        if (!rule_deep_equal($ev, $v)) return false;
    }
    return true;
}

function rule_check_path(mixed $v, array $r): bool
{
    $missing = rule_is_missing($v);
    if (array_key_exists('exists', $r)) {
        $ex = !$missing && $v !== null;
        if ($ex !== (bool)$r['exists']) return false;
    }
    if (array_key_exists('eq', $r) && ($missing || !rule_deep_equal($v, $r['eq']))) return false;
    if (array_key_exists('neq', $r) && !$missing && rule_deep_equal($v, $r['neq'])) return false;
    if (array_key_exists('in', $r)) {
        if ($missing) return false;
        $ok = false;
        foreach ((array)$r['in'] as $x) if (rule_deep_equal($v, $x)) { $ok = true; break; }
        if (!$ok) return false;
    }
    $n = rule_is_num($v) ? (float)$v : null;
    if (array_key_exists('gt', $r) && ($n === null || !($n > $r['gt']))) return false;
    if (array_key_exists('gte', $r) && ($n === null || !($n >= $r['gte']))) return false;
    if (array_key_exists('lt', $r) && ($n === null || !($n < $r['lt']))) return false;
    if (array_key_exists('lte', $r) && ($n === null || !($n <= $r['lte']))) return false;

    $isList = is_array($v) && array_is_list($v);
    $len = $isList ? count($v) : (is_string($v) ? mb_strlen($v) : null);
    if (array_key_exists('includes', $r)) {
        $inc = $r['includes'];
        if ($isList) {
            $ok = false;
            foreach ($v as $x) if (rule_deep_equal($x, $inc)) { $ok = true; break; }
            if (!$ok) return false;
        } elseif (is_string($v) && is_string($inc)) {
            if (!str_contains($v, $inc)) return false;
        } else {
            return false;
        }
    }
    if (array_key_exists('excludes', $r)) {
        $exc = $r['excludes'];
        if ($isList) {
            foreach ($v as $x) if (rule_deep_equal($x, $exc)) return false;
        } elseif (is_string($v) && is_string($exc)) {
            if (str_contains($v, $exc)) return false;
        }
    }
    if (array_key_exists('len_eq', $r) && $len !== (int)$r['len_eq']) return false;
    if (array_key_exists('len_gte', $r) && ($len === null || $len < $r['len_gte'])) return false;
    if (array_key_exists('len_lte', $r) && ($len === null || $len > $r['len_lte'])) return false;
    return true;
}

/** $ctx = ['state' => mixed, 'events' => array] */
function rule_evaluate(array $rule, array $ctx): bool
{
    if (array_key_exists('all', $rule)) {
        foreach ($rule['all'] as $r) if (!rule_evaluate($r, $ctx)) return false;
        return true;
    }
    if (array_key_exists('any', $rule)) {
        foreach ($rule['any'] as $r) if (rule_evaluate($r, $ctx)) return true;
        return false;
    }
    if (array_key_exists('not', $rule)) return !rule_evaluate($rule['not'], $ctx);
    if (array_key_exists('path', $rule)) return rule_check_path(rule_get_path($ctx['state'] ?? null, (string)$rule['path']), $rule);
    if (array_key_exists('event', $rule)) {
        $n = 0;
        foreach ($ctx['events'] ?? [] as $e) {
            if (is_array($e) && rule_event_matches($e, (string)$rule['event'], $rule['where'] ?? null)) $n++;
        }
        return rule_check_count($n, $rule['count'] ?? null);
    }
    if (array_key_exists('before', $rule)) {
        [$a, $b] = $rule['before'];
        $ia = -1;
        $ib = -1;
        foreach (array_values($ctx['events'] ?? []) as $i => $e) {
            $t = is_array($e) ? ($e['type'] ?? null) : null;
            if ($ia === -1 && $t === $a) $ia = $i;
            if ($ib === -1 && $t === $b) $ib = $i;
        }
        return $ia !== -1 && ($ib === -1 || $ia < $ib);
    }
    throw new InvalidArgumentException('Bilinmeyen kural: ' . json_encode($rule, JSON_UNESCAPED_UNICODE));
}

/** JavaScript Math.round ile aynı yuvarlama. */
function js_round(float $x): int
{
    return (int)floor($x + 0.5);
}

function score_clamp(float|int $n): float|int
{
    return max(0, min(100, $n));
}

function score_time(float $durationSec, mixed $targetSec): int
{
    if (!$targetSec || $targetSec <= 0) return 100;
    if ($durationSec <= $targetSec) return 100;
    $over = ($durationSec - $targetSec) / (2 * $targetSec);
    return (int)score_clamp(js_round(100 * (1 - $over)));
}

function score_task(array $task, array $ctx, float $durationSec, int $hints): array
{
    $w = array_merge(['basari' => 70, 'surec' => 20, 'sure' => 10], $task['agirliklar'] ?? []);
    $wSum = ($w['basari'] + $w['surec'] + $w['sure']) ?: 1;

    $kriterler = [];
    foreach ($task['kriterler'] as $k) {
        $kriterler[] = [
            'id' => $k['id'],
            'aciklama' => $k['aciklama'],
            'gecti' => rule_evaluate($k['kural'], $ctx),
            'agirlik' => $k['agirlik'] ?? 1,
            'kazanimlar' => $k['kazanimlar'] ?? [],
        ];
    }
    $pass = function (array $list): int {
        $tw = 0;
        $pw = 0;
        foreach ($list as $k) {
            $tw += $k['agirlik'];
            if ($k['gecti']) $pw += $k['agirlik'];
        }
        return js_round(100 * $pw / ($tw ?: 1));
    };
    $basari = $pass($kriterler);

    $hatalar = [];
    $ceza = 0;
    foreach ($task['hatalar'] ?? [] as $h) {
        if (rule_evaluate($h['kural'], $ctx)) {
            $hatalar[] = ['id' => $h['id'], 'aciklama' => $h['aciklama'], 'ceza' => $h['ceza']];
            $ceza += $h['ceza'];
        }
    }
    $surec = score_clamp(100 - $ceza);
    $sure = score_time($durationSec, $task['sure_hedef'] ?? null);
    $ipucu = $hints * ($task['ipucu_cezasi'] ?? 5);

    $combine = fn(int $b): int => (int)score_clamp(js_round(($b * $w['basari'] + $surec * $w['surec'] + $sure * $w['sure']) / $wSum - $ipucu));
    $puan = $combine($basari);

    $kaz = [];
    foreach ($task['kazanimlar'] as $kod) {
        $ilgili = array_values(array_filter($kriterler, fn($k) => in_array($kod, $k['kazanimlar'], true)));
        $kaz[$kod] = $ilgili ? $combine($pass($ilgili)) : $puan;
    }

    return [
        'puan' => $puan,
        'basari' => $basari,
        'surec' => $surec,
        'sure' => $sure,
        'ipucu' => $ipucu,
        'kriterler' => array_map(fn($k) => ['id' => $k['id'], 'aciklama' => $k['aciklama'], 'gecti' => $k['gecti']], $kriterler),
        'hatalar' => $hatalar,
        'kazanimlar' => $kaz,
    ];
}
