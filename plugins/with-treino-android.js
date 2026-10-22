// Ajustes nativos do Android para o treino seguir com o app fora da tela:
// - serviço em primeiro plano (notificação com o tempo) do react-native-background-actions, tipo mídia;
// - janelinha flutuante (picture-in-picture) na tela principal;
// - ícone da notificação.
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const SERVICE = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

const ICON = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M9,1h6v2h-6z"/>
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,4a9,9 0,1 0,0.001 0zM12,6a7,7 0,1 1,-0.001 0z"/>
  <path android:fillColor="#FFFFFFFF" android:pathData="M11,8h2v5.2l3.2,1.9 -1,1.7 -4.2,-2.5z"/>
</vector>
`;

function withManifest(config) {
  return withAndroidManifest(config, cfg => {
    const app = cfg.modResults.manifest.application[0];

    const main = (app.activity || []).find(a => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:supportsPictureInPicture'] = 'true';
      const changes = new Set((main.$['android:configChanges'] || '').split('|').filter(Boolean));
      ['screenSize', 'smallestScreenSize', 'screenLayout', 'orientation'].forEach(c => changes.add(c));
      main.$['android:configChanges'] = [...changes].join('|');
    }

    app.service = (app.service || []).filter(s => s.$['android:name'] !== SERVICE);
    app.service.push({ $: { 'android:name': SERVICE, 'android:exported': 'false', 'android:foregroundServiceType': 'mediaPlayback' } });
    return cfg;
  });
}

function withIcon(config) {
  return withDangerousMod(config, ['android', async cfg => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ic_stat_bjj.xml'), ICON);
    return cfg;
  }]);
}

module.exports = config => withIcon(withManifest(config));
