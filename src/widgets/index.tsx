import { AppEvents, declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerWidget(
    "roaming_widget",
    WidgetLocation.SidebarEnd,
    {
      dimensions: { height: "auto", width: "280px" },
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
100::Underdog
500::Rookie
1000::SmartKid
2000::Professional
4000::BountyHunter
8000::SmartAss
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


