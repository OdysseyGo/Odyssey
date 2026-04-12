const { withMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  return withMod(config, {
    platform: 'ios',
    mod: 'dangerous', // 'dangerous' mod is used to edit files not directly managed by Expo
    action: async (config) => {
      // Path to the .xcode.env file inside the /ios directory
      const xcodeEnvPath = path.join(config.modRequest.platformProjectRoot, '.xcode.env');
      
      let content = '';
      if (fs.existsSync(xcodeEnvPath)) {
        content = fs.readFileSync(xcodeEnvPath, 'utf8');
      }

      // Check if the flag already exists to prevent duplicate lines
      if (!content.includes('RCT_NEW_ARCH_ENABLED=1')) {
        console.log('» Custom Plugin: Injecting RCT_NEW_ARCH_ENABLED=1 into .xcode.env');
        content += '\nexport RCT_NEW_ARCH_ENABLED=1\n';
        fs.writeFileSync(xcodeEnvPath, content);
      }
      
      return config;
    },
  });
};