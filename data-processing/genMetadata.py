import gzip
import os, json
from tqdm import tqdm
import msgpack

if __name__ == "__main__":
    SHARD_SIZE = 50

    # Get the list of files in the data directory
    files = os.listdir("data/raw_loc")

    # original metadata in "CHI_2025_program.json"
    # Add the metadata for the original file
    with open("data/CHI_2025_program.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    contents = data['contents']
    people = data['people']

    # Step 1: Get the author's affiliations

    # add another entry prevalence for each author entry
    for person in people:
        person['prevalence'] = 0

    def dict_to_tuple(d):
        return tuple(sorted(d.items()))

    for content in contents:
        authors = content['authors']
        for author in authors:
            personId = author['personId']
            for person in people:
                if person['id'] == personId:
                    person['prevalence'] += 1
                    existing_tuples = {dict_to_tuple(
                        a) for a in person.get('affiliations', [])}
                    for new_aff in author.get('affiliations', []):
                        new_tuple = dict_to_tuple(new_aff)
                        if new_tuple not in existing_tuples:
                            person.setdefault('affiliations', []).append(new_aff)
                            existing_tuples.add(new_tuple)
                    break

    for person in people:
        person.pop('importedId', None)
        person.pop('source', None)

        person['fullName'] = " ".join(filter(None, [
            person.get('firstName', ''),
            person.get('lastName', '')
        ]))

        # if (len(person.get('affiliations', [])) > 1):
        #     print(person['fullName'])
        for affiliation in person.get('affiliations', []):
            location_parts = [
                affiliation[field]
                for field in ['city', 'state', 'country']
                if field in affiliation and affiliation[field].strip()
            ]
            if location_parts:
                affiliation['geoLoc'] = ", ".join(location_parts)
            for field in ['city', 'state', 'country']:
                affiliation.pop(field, None)

    # create people lookup
    people_lookup = {}
    for person in people:
        people_lookup[person['id']] = person

    # save people_lookup msgpack, no gz
    with open("data/metadata/people_lookup.msgpack", "wb") as f:
        msgpack.dump(people_lookup, f)

    # Step 2: Create content loopup table
    content_lookup = {}
    idx = 0
    for content in contents:
        content_lookup[content['id']] = {
            'title': content['title'],
            'authors': content['authors'],
            'abstract': content.get('abstract', ""),
            'award': content.get('award', ""),
            'sessionIds': content.get('sessionIds', []),
            'trackId': content['trackId'],
            'typeId': content['typeId'],
            'shardId': idx // SHARD_SIZE,  
        }
        idx += 1

    # write content_lookup to msgpack
    with open("data/metadata/content_lookup.msgpack", "wb") as f:
        msgpack.dump(content_lookup, f)

    # Step 3: Create an id-based lookup for the relevance score and mapped coordinates
    # first simplify the authors into an ID list
    for content in contents:
        content['authors'] = [author['personId'] for author in content['authors']]
        del content['recognitionIds']
        del content['isBreak']
        del content['importedId']
        del content['source']
        del content['tags']
        del content['keywords']
        del content['eventIds']
        del content['trackId']
        del content['typeId']
        content.pop('sessionIds' , None)
        content.pop('abstract', None)
        content.pop("award", None)
        del content['title']
        del content['authors']

    # print(contents[0])

    # read in research_focus_content.json
    with open("data/research_focus_content.json", "r", encoding="utf-8") as f:
        researchFocusContent = json.load(f)
    idMap = {}
    for rf in researchFocusContent:
        idMap[rf['sequence']] = rf['id']
    # print(idMap)

    def bundle_metadata(data_list):
        new_list = []
        for datum in data_list:
            new_list.append({
                "id": datum['metadata']['id'],
                "circularPos": [datum["circle_x"], datum["circle_y"]],
                "relevance": datum["relevance"],
                "category": datum["category_num"]
            })
        return new_list

    for file in tqdm(files):
        with open(os.path.join("data/raw_loc", file), 'r', encoding="utf-8") as f:
            data_list = json.load(f)
        f.close()
        # get filename
        paperId = idMap[int(file[:-5])]
        # find this paperId
        for content in contents:
            if paperId == content['id']:
                content['relationship'] = bundle_metadata(data_list)
    
    # for content that does not have a relationship
    for content in contents:
        if 'relationship' not in content:
            content['relationship'] = []

    # dynamic load lookup
    dynamic_load_lookup = {}

    # store every 50 contents in a msgpack
    for i in range(len(contents) // SHARD_SIZE + 1):
        start = i * SHARD_SIZE
        end = (i + 1) * SHARD_SIZE if (i + 1) * SHARD_SIZE < len(contents) else len(contents)
        with open(f"data/metadata/shards/content_{i}.msgpack", "wb") as f:
            msgpack.dump(contents[start:end], f)


    # Write MessagePack data (binary format)
    # with open("data/metadata/content.msgpack", "wb") as f:
    #     msgpack.dump(contents, f)
    
        
    # with gzip.open("data/metadata/content.json.gz", "wt", encoding="utf-8", compresslevel=9) as f:
    #     json.dump(contents, f, indent=2)

    # # Loop through the files and add the metadata to the dictionary
    # for file in files:
    #     if file.endswith(".json"):
    #         with open(f"data/{file}", "r", encoding="utf-8") as f:
    #             data = json.load(f)
    #             metadata[file] = data

    # # Save the metadata to a JSON file
    # with open("data/metadata.json", "w") as f:
    #     json.dump(metadata, f)