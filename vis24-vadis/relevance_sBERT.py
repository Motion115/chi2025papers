import json
import os
import numpy as np
import torch
from relevance_preserving_map.circular_som import generate_rr_projection
from tqdm import tqdm

from sklearnex import patch_sklearn
patch_sklearn()

if __name__ == '__main__':
    doc_embed_src = 'data/embeddings.pt'
    # load document embeddings - using torch.load() instead of np.load()
    doc_embed = torch.load(doc_embed_src)
    # to numpy
    doc_embed = doc_embed.numpy()

    with open('./data/research_focus_content.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # print(doc_embed.shape)
    # calculate relevance iteratively
    for idx in tqdm(range(doc_embed.shape[0])):
        entry_embed = doc_embed[idx]
        # make it (1 * 384)
        entry_embed = entry_embed.reshape(1, -1)
        # print(entry_embed.shape)
        # calculate relevance with cosine similarity using numpy
        relevance = np.dot(entry_embed, doc_embed.T) / (np.linalg.norm(entry_embed) * np.linalg.norm(doc_embed, axis=1))

        relevance = relevance.flatten()
        som, df, df_list = generate_rr_projection(doc_embed, relevance, data, verbose = False)

        # create raw_loc folder if not there
        if not os.path.exists('./data/raw_loc'):
            os.makedirs('./data/raw_loc')

        # print(df_list)
        # save as json
        with open(f"./data/raw_loc/{idx}.json", "w") as f:
            json.dump(df_list, f, indent=2)
