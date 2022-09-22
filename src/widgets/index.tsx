import { AppEvents, declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerWidget(
    "roaming_widget",
    WidgetLocation.SidebarEnd,
    {
      dimensions: { height: "auto", width: "100%" },
    }
  );

  await plugin.app.registerWidget(
    "debug_widget",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
    }
  );

  await plugin.settings.registerStringSetting({
    id: "level_custom",
    title: "Custom level.",
    defaultValue: 
`0::NoName
1::Underdog
10::Rookie
100::SmartKid
1000::Professional
2000::BountyHunter
4000::SmartAss
10000::Hurricane
12000::SuperStar
14000::Jack
16000::King
20000::Ace
50000::NoName`,
    multiline: true,
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);


