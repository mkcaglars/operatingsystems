#!/usr/bin/env bash
# Derlenmiş siteyi (dist/) ayrı bir dala koyar. Dal geçmişi korunur (her yayın yeni bir commit),
# böylece Hostinger'ın "git pull" işlemi her zaman sorunsuz ilerler.
#   Kullanım: scripts/yayin-dali.sh <klasör> <dal>
set -euo pipefail
SRC=$(realpath "${1:-dist}")
BRANCH="${2:-yayin}"
WT=$(mktemp -d)
SHA=$(git rev-parse --short HEAD)

git config user.name >/dev/null || git config user.name "github-actions[bot]"
git config user.email >/dev/null || git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null; then
  git fetch --depth 1 origin "$BRANCH"
  git worktree add -B "$BRANCH" "$WT" FETCH_HEAD
else
  git worktree add --detach "$WT"
  git -C "$WT" checkout --orphan "$BRANCH"
fi

# Eski içeriği sil (.git hariç), yeni derlemeyi kopyala (.htaccess gibi gizli dosyalar dahil)
find "$WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$SRC"/. "$WT"/
cat > "$WT/BENIOKU.txt" <<TXT
Bu dal otomatik üretilir; elle değiştirmeyin.
İşletim Sistemleri Laboratuvarı'nın derlenmiş hâli (kaynak: main @ $SHA).
Hostinger Git bu dalı public_html'e çeker. Ayar dosyası (isletimsistemi-config.php) burada DEĞİL, sunucuda durur.
TXT

git -C "$WT" add -A
if git -C "$WT" diff --cached --quiet; then
  echo ">> Değişiklik yok, yayın dalı güncel."
else
  git -C "$WT" commit -q -m "Yayın: main @ $SHA"
  git -C "$WT" push origin "$BRANCH"
  echo ">> $BRANCH dalı güncellendi (main @ $SHA)."
fi
git worktree remove --force "$WT"
