(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const token = new URLSearchParams(location.hash.slice(1)).get('contact');
  let session = null, role = token ? 'contact' : 'owner', shareToken = null;
  let watch = null, polling = null, posting = false, mapVisible = false, lastLocationSent = 0;
  let knownAlerts = new Set(), firstSync = true, confirmAction = null;
  const time = value => value ? new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : 'Not set';
  function show(id, visible) { $(id).classList.toggle('hidden',!visible); }
  function feedback(message, error = false) {
    $('liveFeedback').textContent = message;
    $('liveFeedback').className = 'live-banner' + (error ? ' error' : '');
  }
  async function api(body) {
    return window.safeExitRequest('safety', {
      method:body ? 'POST' : 'GET', credentials:'same-origin', cache:'no-store',
      headers:{...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {'X-SafeExit-Link':token} : {})},
      ...(body ? {body:JSON.stringify(body)} : {}),
    });
  }
  function stopTracking() {
    if (watch !== null) navigator.geolocation.clearWatch(watch);
    watch = null;
    $('livePause').disabled = true;
    $('liveResume').disabled = false;
    $('liveTrackingState').textContent = 'Location sharing is paused. The last saved point remains visible.';
  }
  async function enableLocation() {
    if (!navigator.geolocation) { feedback('Location is not supported by this browser. Check-in and SOS remain available.',true); return; }
    if (!window.isSecureContext) { feedback('Location sharing requires HTTPS. Open the secure website address.',true); return; }
    if (watch !== null) return;
    $('liveResume').disabled = true;
    $('livePause').disabled = false;
    $('liveTrackingState').textContent = 'Requesting location permission…';
    watch = navigator.geolocation.watchPosition(async position => {
      if (Date.now()-lastLocationSent < 10000) return;
      lastLocationSent = Date.now();
      try {
        const {latitude,longitude,accuracy} = position.coords;
        await api({action:'location',latitude,longitude,accuracy});
        $('liveTrackingState').textContent = 'Location is updating while this page is active.';
        await sync();
      } catch (error) { lastLocationSent = 0; $('liveTrackingState').textContent = 'Location update failed. Keep this page open to retry.'; feedback(error.message,true); }
    }, error => {
      stopTracking();
      feedback(error.code === 1 ? 'Location permission was declined. You can still set check-ins and send SOS. Enable permission in your browser to share location.' : 'Location is currently unavailable. Try again from an open area.',true);
    }, {enableHighAccuracy:true,maximumAge:10000,timeout:20000});
  }
  function updateLink() {
    const link = shareToken ? `${location.origin}/#contact=${shareToken}` : '';
    $('liveShare').value = link;
    $('liveCopy').disabled = !link;
    show('liveOpen',!!link);
    if (link) $('liveOpen').href = link;
  }
  function renderMap() {
    if (!session || session.latitude === null || !mapVisible) return;
    const lat = session.latitude, lon = session.longitude;
    const iframe = document.createElement('iframe');
    iframe.className = 'live-map'; iframe.title = 'Latest saved location on OpenStreetMap';
    iframe.loading = 'lazy'; iframe.referrerPolicy = 'no-referrer';
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-.008},${lat-.006},${lon+.008},${lat+.006}&layer=mapnik&marker=${lat},${lon}`;
    $('liveMapWrap').replaceChildren(iframe);
    show('liveMapWrap',true);
  }
  function render(data) {
    const previousPosition = session ? `${session.latitude},${session.longitude}` : '';
    session = data.session;
    role = data.role || role;
    show('liveLoading',false); show('liveUnavailable',false);
    show('liveSetup',!session && role === 'owner'); show('liveDashboard',!!session);
    if (!session) { stopTracking(); shareToken = null; updateLink(); return; }
    $('liveTrip').textContent = session.label;
    $('liveRole').textContent = role === 'owner' ? 'YOUR SAFETY SESSION' : 'TRUSTED CONTACT DASHBOARD';
    $('liveExpires').textContent = time(session.expiresAt);
    $('liveSeen').textContent = session.contactSeen ? time(session.contactSeen) : 'Not opened yet';
    show('liveOwnerControls',role === 'owner'); show('liveContactControls',role === 'contact');
    show('liveTimerControls',role === 'owner');
    $('liveDueTitle').textContent = session.deadline ? 'Your next check-in' : 'Choose a deadline';
    $('liveDueTime').textContent = session.deadline ? time(session.deadline) : 'Not armed';
    $('liveDueNote').textContent = session.deadline && new Date(session.deadline) < new Date(data.serverTime) ? 'Deadline missed. An alert is visible on the contact dashboard.' : 'A missed deadline creates an alert on your contact dashboard.';
    const hasLocation = session.latitude !== null && session.longitude !== null;
    $('liveCoordinates').textContent = hasLocation ? `${session.latitude.toFixed(5)}, ${session.longitude.toFixed(5)}` : 'Waiting for a location';
    $('liveLocationInfo').textContent = hasLocation ? `Updated ${time(session.locationAt)} · accuracy approximately ${Math.round(session.accuracy)} m` : 'No position has been shared yet.';
    show('liveMapLink',hasLocation); show('liveShowMap',hasLocation);
    if (hasLocation) $('liveMapLink').href = `https://www.openstreetmap.org/?mlat=${session.latitude}&mlon=${session.longitude}#map=17/${session.latitude}/${session.longitude}`;
    if (previousPosition !== `${session.latitude},${session.longitude}`) renderMap();
    const timeline = $('liveAlerts');
    timeline.replaceChildren();
    if (!data.alerts.length) {
      const empty = document.createElement('div'); empty.className = 'live-empty';
      empty.textContent = 'No alerts yet. Your check-in plan and SOS appear here.'; timeline.append(empty);
    }
    data.alerts.forEach(alert => {
      const item = document.createElement('article'); item.className = 'live-alert'+(alert.resolvedAt ? ' resolved' : '');
      const title = document.createElement('h3'); title.textContent = alert.kind === 'sos' ? 'SOS · traveller requests help' : 'Check-in deadline missed';
      const detail = document.createElement('p'); detail.textContent = `${time(alert.createdAt)} · ${alert.resolvedAt ? 'Resolved by traveller' : alert.acknowledgedAt ? 'Acknowledged by contact' : 'Awaiting acknowledgement'}`;
      item.append(title,detail);
      if (role === 'contact' && !alert.acknowledgedAt && !alert.resolvedAt) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'outline-btn'; button.textContent = 'Acknowledge alert';
        button.onclick = () => act({action:'acknowledge',alertId:alert.id},'Alert acknowledged. Contact the traveller directly.'); item.append(button);
      }
      if (role === 'contact' && !firstSync && !knownAlerts.has(alert.id) && !alert.resolvedAt) {
        feedback('New alert: '+title.textContent);
        if ('Notification' in window && Notification.permission === 'granted') new Notification('SafeExit: '+title.textContent,{body:'Open the dashboard and contact the traveller directly.'});
      }
      knownAlerts.add(alert.id); timeline.append(item);
    });
    firstSync = false;
    $('liveSync').textContent = 'Last synced '+new Date().toLocaleTimeString()+'. Refreshes every 5 seconds.';
    updateLink();
  }
  async function sync() {
    if (polling) return polling;
    polling = (async () => {
    try {
      render(await api());
      show('liveNetwork',false);
    } catch (error) {
      if (error.status === 404) {
        session = null; stopTracking();
        show('liveDashboard',false); show('liveMapWrap',false);
      }
      show('liveLoading',false);
      $('liveNetwork').textContent = error.message+' Saved details may be out of date.';
      show('liveNetwork',true);
      if (!session) {
        show('liveUnavailable',true); show('liveSetup',false);
        $('liveUnavailableText').textContent = error.message;
        $('liveUnavailableTitle').textContent = role === 'contact' ? 'This sharing link is unavailable' : 'Unable to load safety sessions';
      }
    } finally { polling = null; }
    })();
    return polling;
  }
  async function act(body, message) {
    if (posting) return;
    posting = true;
    try {
      if (polling) await polling;
      const result = await api(body);
      if (result.shareToken) { shareToken = result.shareToken; updateLink(); }
      if (body.action === 'end') { stopTracking(); mapVisible = false; show('liveMapWrap',false); }
      if (polling) await polling;
      await sync();
      feedback(message || 'Saved.');
    } catch (error) { feedback(error.message,true); }
    finally { posting = false; }
  }
  function confirm(title, text, action) {
    $('liveConfirmTitle').textContent = title; $('liveConfirmText').textContent = text;
    confirmAction = action; $('liveConfirm').showModal();
  }
  $('liveCreate').addEventListener('submit',async event => {
    event.preventDefault();
    $('liveStart').disabled = true; $('liveStart').textContent = 'Creating private session…';
    await act({action:'create',label:$('liveLabel').value.trim(),duration:Number($('liveDuration').value),consent:$('liveConsent').checked},'Session started. Share the private link with your trusted contact.');
    $('liveStart').disabled = false; $('liveStart').textContent = 'Start safety session';
    if (session) enableLocation();
  });
  $('liveResume').onclick = enableLocation;
  $('livePause').onclick = stopTracking;
  $('liveArm').onclick = () => act({action:'arm',minutes:Number($('liveTimerMinutes').value)},'Check-in deadline set.');
  $('liveCheckin').onclick = () => act({action:'checkin'},'Checked in. Active alerts are resolved.');
  $('liveSOS').onclick = () => confirm('Send an SOS alert?', 'This saves an alert on your trusted contact’s dashboard. It does not send an SMS or dispatch emergency services.',() => act({action:'sos'},'SOS saved. Your contact can see it while their dashboard is open.'));
  $('liveEnd').onclick = () => confirm('End sharing and delete?', 'Your private link stops working immediately. The session, location and alerts are deleted.',() => act({action:'end'},'Sharing ended and session deleted.'));
  $('liveRotate').onclick = () => confirm('Replace the private link?', 'The previous link stops working immediately. Send the new link to your trusted contact.',() => act({action:'rotate'},'Link replaced. Share the new link with your contact.'));
  $('liveCancel').onclick = () => $('liveConfirm').close();
  $('liveConfirmAction').onclick = () => { $('liveConfirm').close(); if (confirmAction) confirmAction(); };
  $('liveCopy').onclick = async () => {
    try { await navigator.clipboard.writeText($('liveShare').value); feedback('Private link copied.'); }
    catch { $('liveShare').focus(); $('liveShare').select(); feedback('Link selected. Use your device’s Copy command.'); }
  };
  $('liveShowMap').onclick = () => { mapVisible = !mapVisible; show('liveMapWrap',mapVisible); $('liveShowMap').textContent = mapVisible ? 'Hide map' : 'Show map (OpenStreetMap)'; if (mapVisible) renderMap(); };
  $('liveRetry').onclick = sync;
  $('liveNotify').onclick = async () => {
    if (!('Notification' in window)) { $('liveNotifyNote').textContent = 'Browser notifications are unavailable here. Keep the dashboard open to see alerts.'; return; }
    try {
      const permission = await Notification.requestPermission();
      $('liveNotifyNote').textContent = permission === 'granted' ? 'Notifications enabled while this dashboard is open.' : 'Notifications are not enabled. Alerts still appear in the dashboard.';
    } catch { $('liveNotifyNote').textContent = 'Notifications are unavailable in this browser.'; }
  };
  if (token) {
    document.body.classList.add('contact-mode');
    document.querySelector('[data-page="safety"]').click();
    $('liveLead').textContent = 'This private dashboard shows the traveller’s latest saved location and alerts. Keep it open and contact them directly if you are concerned.';
    document.querySelector('.brand').removeAttribute('data-go');
    document.querySelector('.brand').addEventListener('click',event => { event.preventDefault(); location.href = '/'; });
  }
  window.addEventListener('pagehide',stopTracking);
  document.addEventListener('visibilitychange',() => {if (!document.hidden) sync();});
  sync();
  setInterval(sync,5000);
})();
