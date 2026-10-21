"""TestFlight-only control via the existing publisher's official Apple client.

No App Store version creation, build selection, or App Store review endpoints.
Credentials are read internally from the private registry/configuration.
"""
import argparse
import datetime
import hashlib
import html
import json
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
APP = '6819605203'
BUNDLE = 'tw.mars.islandtransport'
GROUP = '4667fcd7-7b8e-4351-a4ca-69a804983089'
LINK = 'https://testflight.apple.com/join/pUHeJZFG'
STATE = ROOT / 'docs/testflight-state.json'
NOTES = '''請協助測試這次的三堂交通互動課程：
・蛋糕平安送：觀察蛋糕傾斜，配合扶正與煞車，完成三站配送。
・路口停看讓：停穩後看左右、等待行人到對岸；有新車經過時重新觀察，再讓同一台深藍車出發。
・形狀車票：比較車票與月台的形狀、顏色，邀請乘客上車，按住陪同站穩，再關門出發。

請留意手機與 iPad 直向、橫向操作，暫停與返回學院後再進入課程，以及完成紀錄在關閉、重開 App 後是否保留。安裝後可離線遊玩，不需登入。
若遇到卡住、畫面遮擋或按鈕沒有反應，請透過 TestFlight 回饋附上畫面、裝置型號與操作步驟。這是測試版本，請家長陪同操作。'''
DESCRIPTION = '''《島嶼交通學院》是親子交通互動遊戲。三堂課分別練習把蛋糕平安送到、停看讓後通過路口，以及比對形狀與顏色再陪乘客上車；另有汽車、火車與飛機體驗。
遊戲內容隨 App 安裝，不需登入，可離線遊玩。設定與進度保存在裝置本機，語音使用裝置已安裝的音色。沒有第三方廣告、追蹤或分析 SDK，也沒有內購、訂閱。請家長陪同測試。'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['inspect', 'prepare', 'submit', 'notify'])
    parser.add_argument('--version', default='2.47.3')
    parser.add_argument('--build', default='46')
    args = parser.parse_args()
    assert re.fullmatch(r'\d+\.\d+\.\d+', args.version) and re.fullmatch(r'[1-9]\d*', args.build)
    # The registry is read without copying or printing its contents.
    (Path.home() / '.secrets/CREDENTIALS.md').read_text(encoding='utf-8-sig')
    sys.path.insert(0, str(ROOT.parent / 'game-store-publisher'))
    from apple_publish import AppleClient, AppleCredentials, AppleError
    private = Path.home() / '.secrets/game-store-publisher/credentials.json'
    client = AppleClient(AppleCredentials.from_mapping(json.loads(private.read_text(encoding='utf-8-sig'))['apple'], private.parent))
    state = json.loads(STATE.read_text(encoding='utf-8')) if STATE.exists() else {'appId': APP, 'bundleId': BUNDLE, 'events': []}
    assert state['appId'] == APP and state['bundleId'] == BUNDLE

    def save():
        state['readAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    def listing(resource, query=None):
        rows, included = [], []
        for _ in range(30):
            response = client.request('GET', resource, query)
            rows.extend(response.get('data', [])); included.extend(response.get('included', []))
            following = response.get('links', {}).get('next')
            if not following:
                return rows, included
            url = urllib.parse.urlsplit(following)
            assert url.scheme == 'https' and url.netloc == 'api.appstoreconnect.apple.com' and url.path.startswith('/v1/')
            resource = url.path[4:]; query = dict(urllib.parse.parse_qsl(url.query))
        raise RuntimeError('Pagination not exhausted')

    def mutate(method, resource, payload):
        assert resource.startswith(('builds/', 'betaBuildLocalizations', 'buildBetaDetails/', 'betaGroups/', 'betaAppReviewSubmissions', 'buildBetaNotifications', 'betaAppLocalizations/', 'betaAppReviewDetails/'))
        old = [e for e in state['events'] if e['method'] == method and e['resource'] == resource]
        assert not old or old[-1]['outcome'] != 'UNKNOWN', 'Reconcile previous uncertain mutation before retry'
        event = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'method': method, 'resource': resource, 'outcome': 'UNKNOWN'}
        state['events'].append(event); save()
        try:
            response = client.request(method, resource, payload=payload)
        except AppleError as error:
            if error.http_status in (400, 401, 403, 404, 409, 422, 429):
                event.update(outcome='REJECTED', httpStatus=error.http_status, errors=error.safe_errors)
            save(); raise
        event['outcome'] = 'ACCEPTED'
        if response.get('data', {}).get('id'):
            event['resourceId'] = response['data']['id']
        save()
        return response

    try:
        app = client.request('GET', 'apps/' + APP)['data']
        assert app['attributes']['bundleId'] == BUNDLE and app['attributes']['isOrEverWasMadeForKids'] is True
        versions, _ = listing('apps/' + APP + '/appStoreVersions', {'limit': 200})
        state['appStoreVersions'] = [{'id': v['id'], 'version': v['attributes']['versionString'], 'state': v['attributes']['appStoreState']} for v in versions]
        if 'initialAppStoreVersions' not in state:
            state['initialAppStoreVersions'] = state['appStoreVersions']
        assert sorted(state['appStoreVersions'], key=lambda v: v['id']) == sorted(state['initialAppStoreVersions'], key=lambda v: v['id']), 'App Store versions changed; inspect separately'
        groups, _ = listing('apps/' + APP + '/betaGroups', {'limit': 200})
        group = next(g for g in groups if g['id'] == GROUP)
        assert group['attributes']['name'] == 'MARS Games Testers' and group['attributes']['isInternalGroup'] is False and group['attributes']['publicLink'] == LINK
        state['group'] = {'id': GROUP, **group['attributes']}
        builds, included = listing('builds', {'filter[app]': APP, 'filter[version]': args.build, 'include': 'preReleaseVersion', 'limit': 200})
        releases = {r['id']: r['attributes']['version'] for r in included if r['type'] == 'preReleaseVersions'}
        found = [b for b in builds if releases.get(b['relationships']['preReleaseVersion']['data']['id']) == args.version]
        assert len(found) <= 1
        if found:
            build = found[0]; bid = build['id']; attrs = build['attributes']
            state['build'] = {'id': bid, 'marketingVersion': args.version, **{k: attrs.get(k) for k in ('version', 'processingState', 'expired', 'usesNonExemptEncryption', 'uploadedDate', 'expirationDate')}}
            if args.command != 'inspect':
                assert attrs['processingState'] == 'VALID' and not attrs['expired'], 'Build is not ready'
            if args.command == 'prepare':
                if attrs.get('usesNonExemptEncryption') is not False:
                    mutate('PATCH', 'builds/' + bid, {'data': {'type': 'builds', 'id': bid, 'attributes': {'usesNonExemptEncryption': False}}})
                localizations, _ = listing('builds/' + bid + '/betaBuildLocalizations', {'limit': 200})
                loc = next((x for x in localizations if x['attributes']['locale'] == 'zh-Hant'), None)
                if loc and loc['attributes'].get('whatsNew') != NOTES:
                    mutate('PATCH', 'betaBuildLocalizations/' + loc['id'], {'data': {'type': 'betaBuildLocalizations', 'id': loc['id'], 'attributes': {'whatsNew': NOTES}}})
                elif not loc:
                    mutate('POST', 'betaBuildLocalizations', {'data': {'type': 'betaBuildLocalizations', 'attributes': {'locale': 'zh-Hant', 'whatsNew': NOTES}, 'relationships': {'build': {'data': {'type': 'builds', 'id': bid}}}}})
                app_localizations, _ = listing('apps/' + APP + '/betaAppLocalizations', {'limit': 200})
                for loc in app_localizations:
                    if loc['attributes']['locale'] == 'zh-Hant' and loc['attributes'].get('description') != DESCRIPTION:
                        mutate('PATCH', 'betaAppLocalizations/' + loc['id'], {'data': {'type': 'betaAppLocalizations', 'id': loc['id'], 'attributes': {'description': DESCRIPTION}}})
                review = client.request('GET', 'apps/' + APP + '/betaAppReviewDetail')['data']
                assert all(review['attributes'].get(k) for k in ('contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail'))
                review_notes = f'''External TestFlight test only: {args.version} ({args.build}). No account or demo credentials are required. All content is locally bundled; no third-party advertising, analytics or tracking SDK, in-app purchase, subscription or remote activation is included.
From the initial academy, tap the three-lesson entry, choose cake delivery, crossing observation or shape tickets, then follow the large on-screen buttons. Complete three stations, return to the academy and reopen to check saved progress. Cake delivery combines balancing with braking. Crossing requires stopping, observing both sides and yielding; observe again after new traffic. Tickets require matching shape and color, inviting each passenger and holding to escort them before closing the doors.
Cars, trains and planes are also accessible from the academy. Parent settings use the visible arithmetic parental gate. Installed system voices are optional; visual text remains available. External links do not open in the native child interface. Please test portrait and landscape on iPhone and iPad and offline after installation.'''
                if review['attributes'].get('notes') != review_notes:
                    mutate('PATCH', 'betaAppReviewDetails/' + review['id'], {'data': {'type': 'betaAppReviewDetails', 'id': review['id'], 'attributes': {'notes': review_notes, 'demoAccountRequired': False}}})
                detail = client.request('GET', 'builds/' + bid + '/buildBetaDetail')['data']
                if detail['attributes'].get('autoNotifyEnabled') is not True:
                    mutate('PATCH', 'buildBetaDetails/' + detail['id'], {'data': {'type': 'buildBetaDetails', 'id': detail['id'], 'attributes': {'autoNotifyEnabled': True}}})
                member, _ = listing('betaGroups/' + GROUP + '/builds', {'limit': 200})
                if not any(x['id'] == bid for x in member):
                    mutate('POST', 'betaGroups/' + GROUP + '/relationships/builds', {'data': [{'type': 'builds', 'id': bid}]})
            submissions, _ = listing('betaAppReviewSubmissions', {'filter[build]': bid, 'limit': 200})
            if args.command == 'submit' and not submissions:
                ready = client.request('GET', 'builds/' + bid)['data']['attributes']
                assert ready.get('usesNonExemptEncryption') is False
                locs, _ = listing('builds/' + bid + '/betaBuildLocalizations', {'limit': 200})
                assert any(l['attributes'].get('locale') == 'zh-Hant' and l['attributes'].get('whatsNew') == NOTES for l in locs)
                members, _ = listing('betaGroups/' + GROUP + '/builds', {'limit': 200})
                assert any(b['id'] == bid for b in members)
                detail = client.request('GET', 'builds/' + bid + '/buildBetaDetail')['data']['attributes']
                assert detail.get('autoNotifyEnabled') is True
                mutate('POST', 'betaAppReviewSubmissions', {'data': {'type': 'betaAppReviewSubmissions', 'relationships': {'build': {'data': {'type': 'builds', 'id': bid}}}}})
                submissions, _ = listing('betaAppReviewSubmissions', {'filter[build]': bid, 'limit': 200})
            state['betaReview'] = [{'id': s['id'], **s['attributes']} for s in submissions]
            state['betaDetail'] = client.request('GET', 'builds/' + bid + '/buildBetaDetail')['data']['attributes']
            state['localizations'] = [l['attributes'] for l in listing('builds/' + bid + '/betaBuildLocalizations', {'limit': 200})[0]]
            state['groupBuildIds'] = [b['id'] for b in listing('betaGroups/' + GROUP + '/builds', {'limit': 200})[0]]
            state['build']['usesNonExemptEncryption'] = client.request('GET', 'builds/' + bid)['data']['attributes'].get('usesNonExemptEncryption')
            if args.command == 'notify':
                assert any(s['attributes']['betaReviewState'] == 'APPROVED' for s in submissions)
                assert bid in state['groupBuildIds'] and state['betaDetail']['externalBuildState'] in ('BETA_APPROVED', 'READY_FOR_BETA_TESTING', 'IN_BETA_TESTING')
                assert not any(e['resource'] == 'buildBetaNotifications' and e['outcome'] in ('ACCEPTED', 'UNKNOWN') for e in state['events']), 'Do not duplicate notifications'
                if state['betaDetail'].get('autoNotifyEnabled'):
                    state['notificationPolicy'] = 'APPLE_AUTOMATIC_ON_APPROVAL; no duplicate manual notification'
                else:
                    mutate('POST', 'buildBetaNotifications', {'data': {'type': 'buildBetaNotifications', 'relationships': {'build': {'data': {'type': 'builds', 'id': bid}}}}})
        else:
            state['build'] = None
            assert args.command == 'inspect', 'Requested build not present'
        with urllib.request.urlopen(urllib.request.Request(LINK, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
            raw = response.read(); text = html.unescape(raw.decode('utf-8', 'replace'))
            unavailable = re.search(r'This beta (?:isn.t accepting[^<]+|is full[^<]*)', text, re.I)
            state['publicPage'] = {'url': LINK, 'httpStatus': response.status, 'sha256': hashlib.sha256(raw).hexdigest(), 'unavailableMessage': unavailable.group(0).strip() if unavailable else None, 'joinAvailability': 'UNAVAILABLE' if unavailable else 'NEEDS_VISUAL_CONFIRMATION'}
        save()
        print(json.dumps({k: state.get(k) for k in ('readAt', 'build', 'betaReview', 'betaDetail', 'publicPage')}, ensure_ascii=False))
    except AppleError as error:
        state['lastError'] = {'message': str(error), 'errors': error.safe_errors}; save()
        print(json.dumps(state['lastError'], ensure_ascii=False)); return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
