/* ─── Stages 3–5: login server, tunnel (remote only), access points ───── */

import type { Stage } from "../types";
import clientsConf from "../files/clients.conf?raw";
import eapConf from "../files/eap.conf?raw";
import crlScript from "../files/refresh-wifi-crl.sh?raw";
import crlService from "../files/refresh-wifi-crl.service?raw";
import crlTimer from "../files/refresh-wifi-crl.timer?raw";
import vlanPolicy from "../files/wifi_vlan.conf?raw";

const NOT_YET = { none: ["path:not-yet" as const] };
const RADDB = "/etc/freeradius/3.0";

export const RADIUS_STAGE: Stage = {
  id: "radius",
  title: "Build the login server",
  summary:
    "FreeRADIUS checks each device's certificate and tells the access point which segment to use.",
  when: NOT_YET,
  steps: [
    {
      id: "radius-install",
      title: "Install FreeRADIUS 3.2.5 or newer",
      why: "Versions before 3.2.5 lack protection against a known login-forgery attack (Blast-RADIUS).",
      actions: ["Install the packages.", "Check the version number."],
      commands: [
        {
          label: "On the login-server computer",
          code: "sudo apt install freeradius freeradius-utils\nfreeradius -v | head -1",
        },
      ],
      doneWhen: "The version shown is 3.2.5 or higher.",
      watchOut:
        "If it's older, stop here. Upgrade the operating system or use FreeRADIUS's own packages first.",
      minutes: 15,
      reference: { label: "FreeRADIUS project", href: "https://freeradius.org/" },
    },
    {
      id: "radius-certs",
      title: "Give the login server its certificate",
      why: "Devices check this certificate before trusting the network. It is what stops fake access points.",
      actions: [
        "Issue the server certificate. Enter the provisioner password when asked.",
        "Copy it, the key, and your CA certificates into FreeRADIUS's folder.",
      ],
      commands: [
        {
          label: "Issue and install",
          code: [
            "step ca certificate radius.example.internal server.crt server.key",
            "",
            `W=${RADDB}/certs/wifi`,
            'sudo install -d -o freerad -g freerad -m 750 "$W" "$W/ca.d"',
            'sudo install -o freerad -g freerad -m 640 server.crt server.key "$W/"',
            'cat "$(step path)/certs/root_ca.crt" "$(step path)/certs/intermediate_ca.crt" \\',
            '  | sudo tee "$W/ca.pem" > /dev/null',
            'sudo cp "$(step path)/certs/root_ca.crt" "$W/ca.d/root.pem"',
            'sudo cp "$(step path)/certs/intermediate_ca.crt" "$W/ca.d/intermediate.pem"',
            "shred -u server.key",
          ].join("\n"),
        },
      ],
      doneWhen: "server.crt, server.key, ca.pem, and the ca.d folder exist under certs/wifi.",
      minutes: 15,
    },
    {
      id: "radius-crl",
      title: "Refresh the revocation list every hour",
      why: "FreeRADIUS refuses everyone once its revocation list expires. An hourly refresh keeps it fresh.",
      actions: [
        "Save the script as /usr/local/sbin/refresh-wifi-crl.",
        "Save the two systemd files in /etc/systemd/system/.",
        "Replace ca.example.internal in the script and service with your CA name.",
        "Enable the timer, then run it once now.",
      ],
      commands: [
        { label: "Script: /usr/local/sbin/refresh-wifi-crl", code: crlScript.trimEnd() },
        { label: "Service file", code: crlService.trimEnd() },
        { label: "Timer file", code: crlTimer.trimEnd() },
        {
          label: "Turn it on",
          code: [
            "sudo chmod 755 /usr/local/sbin/refresh-wifi-crl",
            "sudo systemctl daemon-reload",
            "sudo systemctl enable --now refresh-wifi-crl.timer",
            "sudo systemctl start refresh-wifi-crl.service",
            "journalctl -u refresh-wifi-crl.service -n 3",
          ].join("\n"),
        },
      ],
      doneWhen: "The log shows “CRL refreshed” with a next-update time about a day away.",
      watchOut:
        "If the CA stays down for most of a day, the list expires and Wi-Fi logins stop. That is on purpose: it fails closed.",
      minutes: 20,
    },
    {
      id: "radius-config",
      title: "Install the EAP-TLS and segment rules",
      why: "These files accept only your own certificates and send each role to its segment.",
      actions: [
        `Replace ${RADDB}/mods-available/eap with the first file below.`,
        `Save the second file as ${RADDB}/policy.d/wifi_vlan. Change 10, 20, 30 if your VLANs differ.`,
        "Run the commands once. They switch on the segment rules, Blast-RADIUS protection, and login logging.",
      ],
      commands: [
        { label: `File: ${RADDB}/mods-available/eap`, code: eapConf.trimEnd() },
        { label: `File: ${RADDB}/policy.d/wifi_vlan`, code: vlanPolicy.trimEnd() },
        {
          label: "Run once",
          code: [
            `sudo sed -i '/^post-auth {/a wifi_vlan' ${RADDB}/sites-available/default`,
            `sudo sed -i 's/^\\(\\s*\\)require_message_authenticator = auto/\\1require_message_authenticator = yes/' ${RADDB}/radiusd.conf`,
            `sudo sed -i '/^log {/,/^}/ s/^\\(\\s*\\)auth = no/\\1auth = yes/' ${RADDB}/radiusd.conf`,
          ].join("\n"),
        },
      ],
      doneWhen: "The eap and wifi_vlan files are in place, and the three commands ran once.",
      watchOut:
        "The stock file trusts every public certificate authority. Replacing it is what limits logins to your devices.",
      minutes: 30,
    },
    {
      id: "radius-clients",
      title: "Tell FreeRADIUS which access points may ask",
      why: "Each access point proves itself with a shared secret. Long, unique secrets block forged requests.",
      actions: [
        `Replace ${RADDB}/clients.conf with the file below.`,
        "Set ipaddr to your access-point network.",
        "Paste each secret from your password manager.",
        "Check the configuration, then restart.",
      ],
      commands: [
        { label: `File: ${RADDB}/clients.conf`, code: clientsConf.trimEnd() },
        {
          label: "Check and restart",
          code: [
            `sudo chown freerad:freerad ${RADDB}/clients.conf`,
            `sudo chmod 640 ${RADDB}/clients.conf`,
            "sudo freeradius -XC | tail -1",
            "sudo systemctl restart freeradius",
          ].join("\n"),
        },
      ],
      doneWhen: "The check prints “Configuration appears to be OK”.",
      watchOut:
        "If the log says a packet lacks Message-Authenticator, update that access point's firmware. Do not set the option to “no”.",
      minutes: 20,
    },
    {
      id: "radius-test",
      title: "Test a login before any access point is involved",
      why: "If it fails here, the problem is the server, not the Wi-Fi.",
      actions: [
        "Install the test tool and issue a practice certificate.",
        "Save the test file, then run the test. Type the localhost secret when asked.",
        "Run it again with identity set to a different name. It should fail.",
      ],
      commands: [
        {
          label: "Practice certificate and test",
          code: [
            "sudo apt install eapoltest",
            "step ca certificate staff-test-01 staff-test-01.crt staff-test-01.key",
            "",
            "cat > test.conf <<EOF",
            "network={",
            "  key_mgmt=WPA-EAP",
            "  eap=TLS",
            '  identity="staff-test-01"',
            '  ca_cert="$(step path)/certs/root_ca.crt"',
            '  client_cert="$PWD/staff-test-01.crt"',
            '  private_key="$PWD/staff-test-01.key"',
            '  domain_match="radius.example.internal"',
            "}",
            "EOF",
            "",
            "read -rs -p 'localhost secret: ' RS; echo",
            'eapol_test -c test.conf -s "$RS" -a 127.0.0.1 | grep -E "^(SUCCESS|FAILURE)|Attribute 81" -A1',
          ].join("\n"),
        },
      ],
      doneWhen: "You see SUCCESS and Attribute 81 with value 3130 (that is “10”, the Staff VLAN).",
      watchOut:
        "Keep staff-test-01. You will revoke it in the Verify stage to prove revocation works.",
      minutes: 25,
    },
  ],
};

export const TUNNEL_STAGE: Stage = {
  id: "tunnel",
  title: "Protect the path to an off-site server",
  summary:
    "Login traffic must never cross the open internet. A WireGuard tunnel carries it privately.",
  when: { all: ["radius:remote"], none: ["path:not-yet"] },
  steps: [
    {
      id: "tunnel-wireguard",
      title: "Connect your site to the server with WireGuard",
      why: "Plain RADIUS over the internet can be intercepted and forged.",
      actions: [
        "Set up WireGuard between your office router or gateway and the server.",
        "Route your access-point network through the tunnel.",
        "Check the server can reach an access point's address through the tunnel.",
      ],
      doneWhen: "From the server, you can ping an access point's address.",
      watchOut:
        "If the tunnel hides access points behind one address, use that address in clients.conf.",
      minutes: 90,
      reference: { label: "WireGuard quick start", href: "https://www.wireguard.com/quickstart/" },
    },
    {
      id: "tunnel-firewall",
      title: "Close the login port to the internet",
      why: "Only the tunnel should reach the login server.",
      actions: [
        "Allow SSH first, so you don't lock yourself out.",
        "Allow WireGuard, then the login port only on the tunnel.",
      ],
      commands: [
        {
          label: "On the server (wg0 is the tunnel)",
          code: [
            "sudo ufw default deny incoming",
            "sudo ufw allow OpenSSH",
            "sudo ufw allow 51820/udp",
            "sudo ufw allow in on wg0 to any port 1812 proto udp",
            "sudo ufw enable",
            "sudo ufw status verbose",
          ].join("\n"),
        },
      ],
      doneWhen: "ufw status shows 1812 allowed only on wg0.",
      minutes: 15,
    },
  ],
};

export const ACCESS_POINT_STAGE: Stage = {
  id: "access-points",
  title: "Configure your access points",
  summary:
    "Add a new Wi-Fi name that uses the login server. Your current Wi-Fi keeps running beside it.",
  when: NOT_YET,
  steps: [
    {
      id: "ap-unifi",
      title: "Set up UniFi",
      why: "UniFi supports enterprise Wi-Fi and RADIUS-assigned VLANs.",
      actions: [
        "Update every access point's firmware first.",
        "Create a RADIUS profile: login-server address, port 1812, and that access point's secret.",
        "In that profile, turn on RADIUS-assigned VLANs for wireless.",
        "Create the three VLAN networks if they don't exist yet.",
        "Add a new Wi-Fi network. Set security to WPA2/WPA3-Enterprise and choose the RADIUS profile.",
      ],
      doneWhen: "The new Wi-Fi name appears on a phone. The old one still works.",
      watchOut:
        "Menu names change between UniFi versions. Look for “RADIUS”, “Enterprise”, and “VLAN”.",
      minutes: 45,
      reference: {
        label: "UniFi Help Center: RADIUS VLANs",
        href: "https://help.ui.com/hc/en-us/articles/29887064407319",
      },
      when: { all: ["ap:unifi"] },
    },
    {
      id: "ap-other",
      title: "Set up your access points",
      why: "Every business brand has the same three settings under different names.",
      actions: [
        "Update every access point's firmware first.",
        "Find the RADIUS or 802.1X settings. Enter the login-server address, port 1812, and the secret.",
        "Turn on RADIUS-assigned or dynamic VLANs.",
        "Add a new Wi-Fi network using WPA2/WPA3-Enterprise and that RADIUS server.",
      ],
      doneWhen: "The new Wi-Fi name appears on a phone. The old one still works.",
      minutes: 60,
      when: { any: ["ap:other", "ap:unknown"] },
    },
  ],
};
