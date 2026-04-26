package com.noainsure.partner;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PartnerController {

    private final PartnerService partnerService;

    @GetMapping
    public List<PartnerEntity> getPartners() {
        return partnerService.getAllPartners();
    }

    @PostMapping
    public PartnerEntity addPartner(@RequestBody PartnerEntity partner) {
        return partnerService.addPartner(partner);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartnerEntity> updatePartner(@PathVariable String id, @RequestBody PartnerEntity partner) {
        return partnerService.updatePartner(id, partner)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePartner(@PathVariable String id) {
        if (partnerService.deletePartner(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}