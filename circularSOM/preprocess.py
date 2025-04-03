import json

if __name__ == '__main__':
    with open('./data/CHI_2025_program.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    sessions = data['sessions']
    contents = data['contents']
    tracks = data['tracks']

    paper_sessions = [
        "CHI 2025 Papers",
        "CHI 2025 Journals",
        "CHI 2025 Late Breaking Work",
        "CHI 2025 Student Research Competition",
        "CHI 2025 alt.CHI",
        "CHI 2025 Case Studies",
    ]

    paper_sessions_typeIds = set()

    for track in tracks:
        if track['name'] in paper_sessions:
            paper_sessions_typeIds.add(track['typeId'])

    print(paper_sessions_typeIds)


    D = []
    for content in contents:
        # check if the typeId is in the paper_sessions_typeIds
        if content['typeId'] in paper_sessions_typeIds:
            # sessionIds (assume that the first session is the most relevant)
            if len(content['sessionIds']) < 1:
                continue
            sessionId = content['sessionIds'][0]
            sessionName = ""
            # find this sessionId in sessions
            for session in sessions:
                if session['id'] == sessionId:
                    sessionName = session['name']
                    break
            if sessionName != "" and 'abstract' in content.keys():
                dataPoint = {
                    'session': sessionName,
                    'abstract': content['abstract'],
                    'title': content['title'],
                    'content': content['title'] + "\n" + content['abstract'],
                    'id': content['id']
                }
                D.append(dataPoint)

    for i in range(0, len(D)):
        # add sequence
        D[i]['sequence'] = i

    print(len(D))

    with open('./data/research_focus_content.json', 'w', encoding='utf-8') as f:
        json.dump(D, f, ensure_ascii=False, indent=2)