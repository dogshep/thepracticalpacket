---
title: "Fortinet SD-WAN Best Practices"
description: "A practical guide to designing, deploying, and optimizing Fortinet SD-WAN."
pubDate: "2026-06-17"
category: "best-practices"
---

# Fortinet SD-WAN Best Practices: How to Design, Deploy, and Optimize a Secure, High-Performance SD-WAN Fabric

## Hook
SD‑WAN promises simplified operations and better application performance, but many deployments deliver unpredictable failover, poor security posture, or unnecessary cost. This guide will go over what matters in SD-WAN setups, and will go over some gotchas when it comes to design and implementation. Too many times I've seen engineers draw up poor setups and cause headaches for clients.

## The Real
Realistically I don't see SD-WAN used for much more than failover, load-balancing circuits, and load-balancing tunnels. All of the other features you can do with SD-WAN, I hardly ever see. If you set up internet failover or tunnel failover correctly, a user should see minimal interruption when it comes to things failing over. The only notice of an issue on a correctly designed SD-WAN setup should be your monitoring, NOT the user putting in a ticket.

## Why This Matters
- Uptime: Proper design reduces downtime during link outages and maintenance windows. Clients complain when the network goes down, not that it's staying up too long!
- Performance: Intelligent steering and SLAs keep critical apps on fast, low‑loss paths. This means better user experience.
- Cost optimization: Use link selection, service policies, and path selection to avoid unnecessary MPLS or overprovisioned Internet costs. 

## Prerequisites
- Knowledge: Routing basics, IPsec VPN, BGP/OSPF basics, and FortiGate configuration concepts.  
- FortiOS: This guide assumes FortiOS 7.x+ (some CLI/GUI names vary by minor versions).  
- Tools: Access to FortiGate GUI and CLI (SSH)

## Step-by-Step Guide

### SD‑WAN Design Fundamentals
- Define objectives: prioritize applications, resiliency targets, and cost constraints before configuring.  
- Topology: Use hub‑and‑spoke for centralized services (MPLS/Datacenter) and full mesh for site‑to‑site heavy east‑west traffic.  
- Zoning: Place SD‑WAN interfaces into a dedicated SD‑WAN zone where possible to simplify policies and routing.  
- Segmentation: Keep security zones and VLANs intact; SD‑WAN handles transport, not microsegmentation.

#### Example topology decisions
- Critical apps → dual‑WAN active/active with low‑latency SLA.  
- Noncritical backups → prefer low‑cost link, high loss tolerance.

### WAN Link Assessment
- Inventory each link: bandwidth, latency, jitter, packet loss, MTU, interface type (DSL, LTE, fiber), and provider SLAs.  
- Run active tests: iPerf for throughput, ping/traceroute for latency and path. Schedule tests at peak and off‑peak.  
- Verify MTU and MSS along the path; IPsec tunnels can reduce effective MTU—adjust MSS or enable MSS clamping.

### Performance SLAs (Define & Configure)
- Define measurable thresholds: latency (ms), jitter (ms), packet loss (%), and minimum available bandwidth.  
- Map SLAs to business intent (e.g., VoIP: latency < 40ms, jitter < 10ms, loss < 1%).  
- FortiOS example (performance‑SLA object, example syntax varies by version):

```cli
config system sdwan
  config performance-sla
    edit "sla-voip"
      set gateway 8.8.8.8
      set latency-threshold 40
      set jitter-threshold 10
      set packetloss-threshold 1
    next
  end
end
```

Note: In the GUI, navigate to Security Fabric / SD‑WAN / Performance SLA to create these objects visually.

### SD‑WAN Rules and Steering
- Rule strategy: Top‑down, most specific first — match on application, source/destination, or DSCP, then fall back to SLA/priority.  
- Use application awareness (FortiGate DPI) for precise steering, but be mindful of inspection CPU cost.  
- Example: Force SIP traffic to prefer `wan1` unless `sla-voip` fails, then failover to `wan2`.

CLI sketch (policy‑based steering example):

```cli
config firewall policy
  edit 100
    set name "SIP-SD-WAN"
    set srcintf "lan"
    set dstintf "sdwan"
    set srcaddr "all"
    set dstaddr "all"
    set service "SIP"
    set schedule "always"
    set action accept
    set sdwan enable
    set sdwan-routing-method sla
    set sdwan-service "sla-voip"
  next
end
```

In the GUI: Policy & Objects → IPv4 Policy, enable SD‑WAN and pick steering method.

### Application Identification
- Use built‑in application signatures first; add custom application signatures for proprietary apps.  
- When using SSL inspection to ID traffic, consider CPU impact and privacy/compliance constraints—use selective SSL inspection.

### Health Checks
- Combine active probes (ICMP/TCP) and passive metrics (session counters) for robust detection.  
- Configure probe frequency: balance responsiveness vs. probe overhead (e.g., 3–5s for critical voice, 10–30s for general traffic).  
- Example health check (ICMP):

```cli
config system sdwan
  config health-check
    edit "hc-internet"
      set server "8.8.8.8"
      set interval 5000
      set jitter-threshold 10
      set probe-type ping
    next
  end
end
```

Tie health checks to performance SLAs so steering decisions use both path quality and reachability.

### Failover Behavior
- Granularity: Failover can be interface‑level, service‑level, or application‑level—choose based on business criticality.  
- Avoid flapping: add hysteresis and require multiple probe failures before failover.  
- Preserve sessions when possible: For TCP sessions, prefer path pinning unless path is unusable; for UDP/real‑time, enable fast failover.

### Security Integration (ZTNA, IPS, SSL Inspection)
- Zero Trust: Use identity and device posture to gate access to critical services; SD‑WAN should transport, ZTNA enforces access.  
- IPS: Place IPS scanning at egress for Internet‑bound threats and at hub sites for east‑west inspection if capacity allows.  
- SSL Inspection: Use selective (certificate‑based) inspection—exclude sensitive apps and inspect high‑risk destinations.  
- IPsec/Encryption: For site‑to‑site tunnels, prefer AES‑GCM and modern DH groups; plan for MTU adjustments.

Example: Create an IPsec template for SD‑WAN members and reference it for site tunnels (GUI: VPN → IPsec Tunnels / CLI similarly).

### Logging and Monitoring
- Centralize logs: Send logs to FortiAnalyzer or SIEM for retention and correlation.  
- Monitor SD‑WAN KPIs: per‑link bandwidth, latency/jitter/loss, SLA pass/fail, and session counts.  
- Dashboards: Use FortiManager/FortiAnalyzer dashboards for multi‑site summary and alerts.  

Sample syslog target config (syslog-ng / FortiGate):

```cli
config log syslogd1
  set status enable
  set server "10.0.0.10"
  set port 514
end
```

### Troubleshooting Workflow
- Start with the hypothesis: identify symptom (voice issues, slow web), affected flows, and time window.  
- Check link health and SLA history in the GUI: which SLAs failed and when.  
- CLI checks:

```cli
diagnose sys sdwan health-check list
get system performance top
diagnose sniffer packet any "host 8.8.8.8 and icmp" 4
diagnose debug enable
diagnose debug application icap 255
```

- Packet captures: capture on the affected WAN interface and correlate with timestamps.  
- Reproduce with iPerf and varying DSCP or packet sizes to validate steering and SLA behavior.  
- When IPsec is involved: verify phase‑1/phase‑2 negotiations and look for MTU/fragmentation issues.

## Vendor Differences / Gotchas (Fortinet Specific)
- SD‑WAN session pinning: FortiGate pins sessions to the outgoing interface — stateful failover behavior differs from routers that use per‑packet ECMP.  
- Firewall policy order: SD‑WAN steering is influenced by policy order; misplaced policies cause unexpected paths.  
- DPI Cost: Application identification relies on DPI which consumes CPU — on high throughput sites, tune inspection or use flow‑based inspection.  
- FortiOS version quirks: CLI object names and locations have changed between 6.x → 7.x; always verify commands in your FortiOS version.  
- Asymmetric routing & session helpers: If return path differs, some protocols may break—consider NAT or enable session helpers where appropriate.

## Common Mistakes
- 1. No upfront SLA definition — steering without SLAs leads to poor outcomes.  
- 2. Over‑reliance on DNS or passive metrics for failover — miss packet loss and jitter.  
- 3. Forgetting MTU/MSS when layering IPsec — causes fragmentation and performance hits.  
- 4. Enabling full SSL inspection without capacity planning — this can overload the FortiGate and break flows; use selective inspection and exception lists instead.  
- 5. Putting SD‑WAN interfaces in multiple policies with conflicting actions.  
- 6. No logging or retention policy — without historic SD‑WAN/SLA logs, intermittent failures are impossible to diagnose and capacity trends remain hidden.  
- 7. Testing only during business hours — miss peak‑time behavior.

## Validation & Testing (Checklist)
- Configuration checks:
  - SD‑WAN status is enabled and members are listed.  
  - Performance SLAs exist and map to services.  
  - Policies have `set sdwan enable` (or GUI equivalent) where needed.  
- Functional tests:
  - Ping and traceroute through each WAN path to the SLA target.  
  - iPerf from site to hub to validate throughput and latency.  
  - Simulate link failure (shut interface) and confirm failover behavior.  
  - Simulate SLA degradation (rate limit or add jitter) and confirm steering.  
- App tests:
  - Validate VoIP calls, video, and critical app login flows.  
  - Confirm session persistence for long‑lived TCP transfers.  
- Observability:
  - Confirm logs reach FortiAnalyzer/SIEM.  
  - Validate dashboard alerts for SLA failures.  

Quick CLI checks:

```cli
get system sdwan status
diagnose sys sdwan health-check list
diagnose sniffer packet any "port 5060" 10
```

## Summary
You now have a practical checklist and configuration pattern to design, deploy, and optimize Fortinet SD‑WAN for real business needs. Start by defining SLAs and objectives, assess links, configure health checks and steering rules, integrate security controls thoughtfully, and validate with repeatable tests. With clear policies, observability, and controlled failover behavior, SD‑WAN will deliver resiliency and performance without compromising security.

---
Published on The Practical Packet — Hands‑On Networking for the Real World.
