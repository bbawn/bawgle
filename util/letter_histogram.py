#!/usr/bin/env python

# Usage: letter_histogram 
# Outputs a histogram of occurrence fraction of boggle game letters in text read from 
# stdin. Quirks:
#
# 1. Boggle game letters may consist of multiple text letters (e.g. qu)
# The array of game letters is given in the json config file. The output histogram gives
# fraction of total for each boggle game letter.
#
# 2. Some characters (unicode code points) should be considered equivalent to 
# a boggle game letter that is a different character (or character sequence). 
# The json config file gives a map with a key for each character that should 
# match a different character(s) in the game letter set. The map value is that 
# game letter. For example, in Spanish, the character LATIN SMALL LETTER O 
# WITH ACUTE should match normal lower-case o in the game set. The histogram 
# maps occurrences of each boggle letter plus any characters that equivalent
# to it.
#
# Expects utf-8 encoded input.


import argparse
import codecs
import json
import string
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--hist", help="json histogram output file")
parser.add_argument("--dict", help="text file with all dictionary words")
parser.add_argument("--cfg", help="json file with with language's game configuration")
args = parser.parse_args()

if args.hist:
    fout = open(args.hist, 'w')
else:
    fout = sys.stdout

if args.dict:
    fin = open(args.dict, 'r')
else:
    fin = sys.stdout

# Wrap input and stdout so they handle utf-8 encoding
fin = codecs.getreader('utf-8')(fin)
fout = codecs.getwriter('utf-8')(fout)

if args.cfg:
    with open(args.cfg, 'r') as fcfg:
        cfg = json.load(fcfg)

# Use a map of game cell letter sequences keyed on first letter to
# handle game letters with multiple text letters (e.g. "qu")
letter_map = {}
for l in cfg['letters']:
  letter_map[l[0]] = l

histogram = {}
# text = unicode(fin.read(), 'utf-8')
text = fin.read()
count = 0
letter_seq = None
letter = None
discard_count = 0
for ch in text:
    ch = string.lower(ch)
    if letter:
        if ch == letter_seq[len(letter)]:
            letter += ch 
            if len(letter) != len(letter_seq):
                continue
        else:
            sys.stderr.write('Incomplete letter sequence. Discarding letter "' 
                + letter + '" next: "' + ch + '\n')
            discard_count += 1
            letter = None  
            continue
    elif ch in letter_map:
        letter = ch
        letter_seq = letter_map[ch] 
        if len(letter_seq) != 1:
            continue
    else:
        continue

    if letter in cfg['equivClasses']:
        letter = cfg['equivClasses'][letter]
    if letter in histogram:
        histogram[letter] += 1
    else:
        histogram[letter] = 1

    count += 1
    if count % 100000 == 0:
        sys.stderr.write(str(count) + '\n')

    letter = None

sys.stderr.write('Letter count: ' + str(count) + ' discards: ' + 
    str(discard_count) + '\n')

# Use fractions instead of count so weighting function doesn't need to
# know the count
for k in sorted(histogram.keys()):
    frac = histogram[k] / float(count)
    sys.stderr.write(k + ': ' + str(histogram[k]) 
        + ' (' + str(frac) + ')\n')
    histogram[k] = frac
    
json.dump(histogram, fout, sort_keys=True, indent=2, separators=(',', ': '), encoding='utf-8')
