import json

if __name__ == '__main__':
    with open('./data/CHI_2025_program.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    typeMap = {}

    tracks = data['tracks']

    for track in tracks:
        typeMap[track['id']] = track['name']

    with open('./data/typeMap.json', 'w', encoding='utf-8') as f:
        json.dump(typeMap, f, ensure_ascii=False, indent=2)
