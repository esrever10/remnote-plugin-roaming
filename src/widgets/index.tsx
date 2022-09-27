import { AppEvents, declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {

  function roam() {
    plugin.messaging.broadcast("roam");
  }

  async function registerRoamCommand(plugin: ReactRNPlugin, shortcut: string) {
    await plugin.app.registerCommand({
      id: `roaming`,
      name: `Roam`,
      keyboardShortcut: shortcut,
      action: () => {
        roam();
      },
    });
  }

  registerRoamCommand(plugin, "ctrl+alt+.");

  let dice=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M14 6a2.5 2.5 0 00-4-3 2.5 2.5 0 00-4 3H3.25C2.56 6 2 6.56 2 7.25v.5C2 8.44 2.56 9 3.25 9h6V6h1.5v3h6C17.44 9 18 8.44 18 7.75v-.5C18 6.56 17.44 6 16.75 6H14zm-1-1.5a1 1 0 01-1 1h-1v-1a1 1 0 112 0zm-6 0a1 1 0 001 1h1v-1a1 1 0 00-2 0z" clipRule="evenodd" />
    <path d="M9.25 10.5H3v4.75A2.75 2.75 0 005.75 18h3.5v-7.5zM10.75 18v-7.5H17v4.75A2.75 2.75 0 0114.25 18h-3.5z" />
  </svg>`;

  if (document.querySelector("#random-rem-global") === null && document.querySelector("#document-sidebar > div.shrink-0.w-full > div.flex.items-center.p-2.gap-2 > div.flex.items-center.justify-center") !== null) {
    let el = document.createElement("div")
    el.id = "random-rem-global";
    el.className = "flex items-center justify-center rn-clr-background-secondary shrink-0 w-5 h-5 rounded-md rn-clr-content-secondary cursor-pointer hover:rn-clr-background--hovered hover:font-semibold hover:text-gray-50"
    el.innerHTML = dice;
    el.addEventListener ("click", roam);
    const sidebar = document?.querySelector("#document-sidebar > div.shrink-0.w-full > div.flex.items-center.p-2.gap-2 > div.flex.items-center.justify-center")?.parentElement
    sidebar?.append(el);
  } 
  


  await plugin.app.registerWidget(
    "roaming_widget",
    WidgetLocation.SidebarEnd,
    {
      dimensions: { height: "auto", width: "100%" },
    }
  );

  await plugin.settings.registerStringSetting({
    id: "roaming_shortcut",
    title: "Replace shortcut key for roaming.",
    defaultValue: "ctrl+alt+.",
  });

  plugin.event.addListener(
    AppEvents.SettingChanged,
    "roaming_shortcut",
    async ({ value }) => {
      registerRoamCommand(plugin, value);
    }
  );

  // await plugin.app.registerWidget(
  //   "debug_widget",
  //   WidgetLocation.RightSidebar,
  //   {
  //     dimensions: { height: "auto", width: "100%" },
  //   }
  // );

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


