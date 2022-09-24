import React from "react";
import {
  AppEvents,
  RemViewer,
  renderWidget,
  RichTextInterface,
  useAPIEventListener,
  useOnMessageBroadcast,
  usePlugin,
} from "@remnote/plugin-sdk";
import * as Re from "remeda"

const { useState, useEffect } = React;

function richText2log(text: RichTextInterface) {
    const values = Array.from(text.values());
    return values.map((item) => {
      switch(item.i) {
        case undefined:
          return item;
        case 's':
          return `(s, ${item.delimiterCharacterForSerialization})`
        case 'm':
        case 'n':
        case 'x':
          return `(${item.i}, ${item.text})`
        default:
          return `(${item.i},)`
      }
    }).join(' | ');
  }

function DebugWidget() {
  const [remId, setRemId] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [info, setInfo] = useState<Map<string, any>>(new Map());
  const plugin = usePlugin();

  useOnMessageBroadcast("log", (message) => {
    logs.push(message);
    setLogs(logs);
  })

  useAPIEventListener(AppEvents.FocusedRemChange, undefined, async (args) => {
    console.log(args);
    const remId = args.nextRemId;
    setRemId(remId);

    const rem = await plugin.rem.findOne(remId);
    setInfo(new Map());
    if (rem) {
        info?.set("isPowerupEnum", await rem?.isPowerupEnum())
        info?.set("isPowerupProperty", await rem?.isPowerupProperty())
        info?.set("isPowerup", await rem?.isPowerup())
        info?.set("isPowerupPropertyListItem", await rem?.isPowerupPropertyListItem())
        info?.set("isPowerupSlot", await rem?.isPowerupSlot())
        info?.set("isSlot", await rem?.isSlot())
        info?.set("isDocument", await rem?.isDocument())
        info?.set("parent-isPowerupSlot",await (await rem.getParentRem())?.isPowerupSlot())
        info?.set("hasPowerup:f", await rem?.hasPowerup('f'))
        info?.set("hasPowerup:z", await rem?.hasPowerup('z'))
        info?.set("hasPowerup:b", await rem?.hasPowerup('b'))
        info?.set("parent-hasPowerup:f", await (await rem?.getParentRem())?.hasPowerup('f'))
        info?.set("parent-hasPowerup:z", await (await rem?.getParentRem())?.hasPowerup('z'))
        info?.set("parent-parent-hasPowerup:z", await (await (await rem.getParentRem())?.getParentRem())?.hasPowerup('f'))
        
        info?.set("richtext", richText2log(rem.text));
        setInfo(info);
    }
  })

  return (
    <div className="flex flex-col">
        <RemViewer remId={remId} width='50%'></RemViewer>
        {info ? 
            <ul>
                {Re.map.indexed(Array.from(info?.keys()!), (x, i) => 
                    <li key={i}>
                        {x}: {JSON.stringify(info?.get(x))}
                    </li>
                )}
            </ul>
        :""}
        <div>
          <ul>
            {logs.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        
    </div>
  );
}

renderWidget(DebugWidget);
